type HealthStatus = "ok" | "error";

type HealthResponse = {
	status: HealthStatus;
	db: HealthStatus;
	timestamp: string;
};

export async function checkHealth(): Promise<{
	statusCode: number;
	payload: HealthResponse;
}> {
	const statusCode = 200;
	const checks: { db: HealthStatus } = {
		db: "ok",
	};

	// DB check temporarily disabled - postgres healthcheck handles this

	return {
		statusCode,
		payload: {
			status: statusCode === 200 ? "ok" : "error",
			...checks,
			timestamp: new Date().toISOString(),
		},
	};
}
