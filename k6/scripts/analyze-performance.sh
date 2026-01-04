#!/bin/bash
# Comprehensive Performance Analysis Script
# Run this via SSH while k6 load test is running
#
# Usage (single snapshot):
#   ssh deploy@your-vps "bash -s" < k6/scripts/analyze-performance.sh
#
# Usage (continuous monitoring every 5s for 60s):
#   ssh deploy@your-vps "MODE=monitor INTERVAL=5 DURATION=60 bash -s" < k6/scripts/analyze-performance.sh
#
# Usage (detailed PostgreSQL analysis):
#   ssh deploy@your-vps "MODE=postgres STORE_SLUG=pizza-weso bash -s" < k6/scripts/analyze-performance.sh
#
# Usage (connection pool deep dive):
#   ssh deploy@your-vps "MODE=pool bash -s" < k6/scripts/analyze-performance.sh
#
# Modes:
#   full     - System + Docker + PostgreSQL + Network (default)
#   monitor  - Continuous live monitoring
#   postgres - EXPLAIN ANALYZE + query stats
#   pool     - Connection pool deep dive (waiting, age, clients)
#   system   - CPU, memory, disk only
#   docker   - Container stats only

set -e

# Configuration
MODE="${MODE:-full}"        # full | monitor | postgres | system | docker
INTERVAL="${INTERVAL:-0}"   # 0 = single snapshot, >0 = repeat interval
DURATION="${DURATION:-30}"  # Total monitoring duration
DB_NAME="${DB_NAME:-menuvo}"
DB_USER="${DB_USER:-menuvo}"
DB_HOST="${DB_HOST:-localhost}"
STORE_SLUG="${STORE_SLUG:-pizza-weso}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

header() {
    echo ""
    echo -e "${CYAN}━━━ $1 ━━━${NC}"
}

warn() {
    echo -e "${RED}⚠ $1${NC}"
}

ok() {
    echo -e "${GREEN}✓ $1${NC}"
}

get_postgres_container() {
    # Find the main postgres container (not backup)
    docker ps --format '{{.Names}}' 2>/dev/null | grep -E '^[^-]*-?postgres$|postgres-[0-9]+$|menuvo-postgres$' | head -1
}

run_query() {
    # Try Docker first, then direct connection
    local container
    if command -v docker &> /dev/null; then
        container=$(get_postgres_container)
        if [ -n "$container" ]; then
            docker exec "$container" psql -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>/dev/null
            return
        fi
    fi
    if [ -n "$PGPASSWORD" ]; then
        PGPASSWORD="${PGPASSWORD}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>/dev/null
    else
        psql -U "$DB_USER" -d "$DB_NAME" -c "$1" 2>/dev/null || echo "Cannot connect to PostgreSQL"
    fi
}

run_query_value() {
    local result container
    if command -v docker &> /dev/null; then
        container=$(get_postgres_container)
        if [ -n "$container" ]; then
            result=$(docker exec "$container" psql -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null | tr -d ' \n')
        fi
    fi
    if [ -z "$result" ]; then
        if [ -n "$PGPASSWORD" ]; then
            result=$(PGPASSWORD="${PGPASSWORD}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null | tr -d ' \n')
        else
            result=$(psql -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null | tr -d ' \n')
        fi
    fi
    # Return 0 if empty or not a number
    if [[ -z "$result" || ! "$result" =~ ^[0-9.]+$ ]]; then
        echo "0"
    else
        echo "$result"
    fi
}

# ============================================================================
# SYSTEM METRICS
# ============================================================================
collect_system() {
    header "System Load"

    # Load average
    echo -n "Load Average: "
    uptime | awk -F'load average:' '{print $2}'

    # CPU
    echo -n "CPU: "
    if command -v mpstat &> /dev/null; then
        mpstat 1 1 2>/dev/null | tail -1 | awk '{printf "%.1f%% used (%.1f%% user, %.1f%% sys, %.1f%% iowait)\n", 100-$12, $3, $5, $6}'
    else
        top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{gsub(/,/,""); print $2"% user, "$4"% sys, "$8"% idle"}' || echo "N/A"
    fi

    # Memory
    echo -n "Memory: "
    free -m 2>/dev/null | awk 'NR==2{printf "%.1f GB / %.1f GB (%.0f%% used)\n", $3/1024, $2/1024, $3/$2*100}' || echo "N/A"

    # Disk
    echo -n "Disk: "
    df -h / 2>/dev/null | awk 'NR==2{print $3" / "$2" ("$5" used)"}' || echo "N/A"
}

# ============================================================================
# DOCKER METRICS
# ============================================================================
collect_docker() {
    header "Docker Containers"

    if ! command -v docker &> /dev/null; then
        echo "Docker not installed"
        return
    fi

    # Container stats
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}" 2>/dev/null || echo "No containers running"

    # Check for high CPU/memory
    HIGH_CPU=$(docker stats --no-stream --format "{{.CPUPerc}}" 2>/dev/null | tr -d '%' | awk '$1 > 80 {count++} END {print count+0}')
    if [ "$HIGH_CPU" -gt 0 ]; then
        warn "$HIGH_CPU container(s) using >80% CPU"
    fi
}

# ============================================================================
# POSTGRESQL METRICS
# ============================================================================
collect_postgres() {
    header "PostgreSQL Status"

    # Connection pool
    ACTIVE=$(run_query_value "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND state = 'active';")
    IDLE=$(run_query_value "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND state = 'idle';")
    IDLE_TXN=$(run_query_value "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND state = 'idle in transaction';")
    WAITING=$(run_query_value "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND wait_event_type IS NOT NULL AND state = 'active';")
    TOTAL=$((ACTIVE + IDLE + IDLE_TXN))

    echo "Connections: $TOTAL total ($ACTIVE active, $IDLE idle, $IDLE_TXN idle-in-txn)"

    if [ "$ACTIVE" -ge 18 ]; then
        warn "Connection pool near capacity! ($ACTIVE/20 active)"
    elif [ "$ACTIVE" -ge 15 ]; then
        echo -e "${YELLOW}Connection pool getting full ($ACTIVE/20 active)${NC}"
    else
        ok "Connection pool OK ($ACTIVE/20 active)"
    fi

    if [ "$WAITING" -gt 0 ]; then
        warn "$WAITING connections waiting (lock/IO)"
    fi

    if [ "$IDLE_TXN" -gt 0 ]; then
        warn "$IDLE_TXN idle-in-transaction (potential leak)"
    fi

    # Slow queries
    SLOW=$(run_query_value "SELECT count(*) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND state = 'active' AND query_start < now() - interval '200 milliseconds';")
    if [ "$SLOW" -gt 0 ]; then
        warn "$SLOW queries running > 200ms"
    fi

    # Cache hit ratio
    HIT_RATIO=$(run_query_value "SELECT round(100.0 * sum(heap_blks_hit) / nullif(sum(heap_blks_hit + heap_blks_read), 0), 1) FROM pg_statio_user_tables;")
    echo "Cache Hit Ratio: ${HIT_RATIO}%"
    if [ "$(echo "$HIT_RATIO < 95" | bc 2>/dev/null || echo 0)" -eq 1 ]; then
        warn "Cache hit ratio below 95%"
    fi
}

# Connection pool detailed view
collect_pool() {
    header "Connection Pool Details"

    echo -e "${BOLD}Pool Summary:${NC}"
    run_query "
    SELECT
      state,
      count(*) as connections,
      round(avg(extract(epoch from (now() - backend_start)))::numeric, 0) as avg_age_sec,
      round(max(extract(epoch from (now() - backend_start)))::numeric, 0) as max_age_sec,
      round(avg(extract(epoch from (now() - state_change)))::numeric, 2) as avg_state_sec
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
    GROUP BY state
    ORDER BY count(*) DESC;
    "

    echo ""
    echo -e "${BOLD}Waiting Connections:${NC}"
    run_query "
    SELECT
      pid,
      wait_event_type,
      wait_event,
      state,
      now() - query_start as wait_time,
      left(query, 60) as query
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
      AND wait_event_type IS NOT NULL
    ORDER BY query_start
    LIMIT 10;
    "

    echo ""
    echo -e "${BOLD}Connections by Client:${NC}"
    run_query "
    SELECT
      client_addr,
      count(*) as connections,
      count(*) FILTER (WHERE state = 'active') as active,
      count(*) FILTER (WHERE state = 'idle') as idle
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
    GROUP BY client_addr
    ORDER BY count(*) DESC;
    "

    echo ""
    echo -e "${BOLD}Long-Running Queries (> 500ms):${NC}"
    run_query "
    SELECT
      pid,
      now() - query_start as duration,
      state,
      wait_event_type,
      left(query, 80) as query
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
      AND state != 'idle'
      AND query_start < now() - interval '500 milliseconds'
    ORDER BY query_start
    LIMIT 10;
    "

    echo ""
    echo -e "${BOLD}Connection Age Distribution:${NC}"
    run_query "
    SELECT
      CASE
        WHEN extract(epoch from (now() - backend_start)) < 60 THEN '< 1 min'
        WHEN extract(epoch from (now() - backend_start)) < 300 THEN '1-5 min'
        WHEN extract(epoch from (now() - backend_start)) < 900 THEN '5-15 min'
        ELSE '> 15 min'
      END as age_bucket,
      count(*) as connections
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME'
    GROUP BY 1
    ORDER BY min(extract(epoch from (now() - backend_start)));
    "

    echo ""
    echo -e "${BOLD}PostgreSQL Settings:${NC}"
    run_query "
    SELECT name, setting, unit
    FROM pg_settings
    WHERE name IN ('max_connections', 'superuser_reserved_connections', 'idle_in_transaction_session_timeout', 'statement_timeout');
    "
}

collect_postgres_detailed() {
    header "PostgreSQL Detailed Analysis"

    echo ""
    echo -e "${BOLD}Connection Pool:${NC}"
    run_query "
    SELECT state, count(*) as count,
           round(avg(extract(epoch from (now() - state_change)))::numeric, 2) as avg_sec
    FROM pg_stat_activity WHERE datname = '$DB_NAME'
    GROUP BY state ORDER BY count DESC;
    "

    echo ""
    echo -e "${BOLD}Active Queries (> 100ms):${NC}"
    run_query "
    SELECT pid, now() - query_start as duration, wait_event_type, left(query, 80) as query
    FROM pg_stat_activity
    WHERE datname = '$DB_NAME' AND state = 'active'
      AND query_start < now() - interval '100 milliseconds'
    ORDER BY query_start LIMIT 5;
    "

    echo ""
    echo -e "${BOLD}EXPLAIN ANALYZE - Stores Query:${NC}"
    run_query "
    EXPLAIN (ANALYZE, BUFFERS, COSTS)
    SELECT s.*, m.supported_languages, m.payment_capabilities_status
    FROM stores s
    LEFT JOIN merchants m ON s.merchant_id = m.id
    WHERE s.slug = '$STORE_SLUG' AND s.is_active = true;
    "

    echo ""
    echo -e "${BOLD}EXPLAIN ANALYZE - Categories Query:${NC}"
    run_query "
    EXPLAIN (ANALYZE, BUFFERS, COSTS)
    SELECT c.* FROM categories c
    JOIN stores s ON c.store_id = s.id
    WHERE s.slug = '$STORE_SLUG' AND c.is_active = true
    ORDER BY c.display_order;
    "

    echo ""
    echo -e "${BOLD}EXPLAIN ANALYZE - Items Query:${NC}"
    run_query "
    EXPLAIN (ANALYZE, BUFFERS, COSTS)
    SELECT i.* FROM items i
    JOIN categories c ON i.category_id = c.id
    JOIN stores s ON c.store_id = s.id
    WHERE s.slug = '$STORE_SLUG' AND c.is_active = true AND i.is_available = true
    ORDER BY i.display_order;
    "

    echo ""
    echo -e "${BOLD}Table Statistics:${NC}"
    run_query "
    SELECT relname as table_name, seq_scan, idx_scan,
           CASE WHEN seq_scan + idx_scan > 0
                THEN round(100.0 * idx_scan / (seq_scan + idx_scan), 1)
                ELSE 0 END as idx_pct,
           n_live_tup as rows
    FROM pg_stat_user_tables
    WHERE relname IN ('stores', 'categories', 'items', 'option_groups', 'option_choices', 'item_option_groups')
    ORDER BY seq_scan DESC;
    "

    echo ""
    echo -e "${BOLD}Indexes on stores:${NC}"
    run_query "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'stores';"
}

# ============================================================================
# NETWORK METRICS
# ============================================================================
collect_network() {
    header "Network"

    # Connections to app port
    APP_CONNS=$(ss -tn state established '( dport = :3000 or sport = :3000 )' 2>/dev/null | tail -n +2 | wc -l)
    echo "App connections (port 3000): $APP_CONNS"

    # Connections to DB port
    DB_CONNS=$(ss -tn state established '( dport = :5432 or sport = :5432 )' 2>/dev/null | tail -n +2 | wc -l)
    echo "DB connections (port 5432): $DB_CONNS"
}

# ============================================================================
# FULL SNAPSHOT
# ============================================================================
full_snapshot() {
    echo ""
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║       Performance Analysis - $(date '+%Y-%m-%d %H:%M:%S')        ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

    collect_system
    collect_docker
    collect_postgres
    collect_network

    echo ""
    echo -e "${CYAN}━━━ Summary ━━━${NC}"
    echo "For detailed PostgreSQL analysis: MODE=postgres"
    echo "For continuous monitoring: MODE=monitor INTERVAL=5"
}

# ============================================================================
# MONITORING LOOP
# ============================================================================
monitor_loop() {
    END_TIME=$(($(date +%s) + DURATION))
    echo "Continuous monitoring every ${INTERVAL}s for ${DURATION}s (Ctrl+C to stop)"

    while [ $(date +%s) -lt $END_TIME ]; do
        clear 2>/dev/null || true
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║       Live Monitor - $(date '+%H:%M:%S') (${DURATION}s remaining)              ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

        collect_system
        collect_docker
        collect_postgres

        DURATION=$((END_TIME - $(date +%s)))
        sleep "$INTERVAL"
    done

    echo ""
    echo -e "${GREEN}=== Monitoring Complete ===${NC}"
}

# ============================================================================
# MAIN
# ============================================================================
case "$MODE" in
    full)
        full_snapshot
        ;;
    monitor)
        if [ "$INTERVAL" -eq 0 ]; then
            INTERVAL=5
        fi
        monitor_loop
        ;;
    postgres)
        collect_postgres_detailed
        ;;
    pool)
        collect_pool
        ;;
    system)
        collect_system
        ;;
    docker)
        collect_docker
        ;;
    *)
        echo "Unknown mode: $MODE"
        echo "Available modes: full, monitor, postgres, pool, system, docker"
        exit 1
        ;;
esac
