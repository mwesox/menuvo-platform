"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	CATEGORY_INTERSECTION_ROOT_MARGIN,
	HEADER_OFFSET,
} from "../../constants";

interface Category {
	id: number;
}

interface UseCategoryScrollOptions {
	categories: Category[];
}

interface UseCategoryScrollReturn {
	activeCategoryId: number | null;
	categoryRefs: React.MutableRefObject<Map<number, HTMLDivElement>>;
	setCategoryRef: (
		categoryId: React.Key | null | undefined,
	) => (el: HTMLDivElement | null) => void;
	handleCategoryClick: (categoryId: number) => void;
}

/**
 * Hook for managing category scroll behavior and active category tracking.
 * Uses IntersectionObserver to track which category is in view and provides
 * smooth scrolling to categories on click.
 */
export function useCategoryScroll({
	categories,
}: UseCategoryScrollOptions): UseCategoryScrollReturn {
	const [activeCategoryId, setActiveCategoryId] = useState<number | null>(
		categories[0]?.id ?? null,
	);
	const categoryRefs = useRef<Map<number, HTMLDivElement>>(new Map());

	// Handle category click - scroll to section
	const handleCategoryClick = useCallback((categoryId: number) => {
		const element = categoryRefs.current.get(categoryId);
		if (element) {
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.scrollY - HEADER_OFFSET;

			window.scrollTo({
				top: offsetPosition,
				behavior: "smooth",
			});
		}
	}, []);

	// Store ref setter
	const setCategoryRef = useCallback(
		(categoryId: React.Key | null | undefined) =>
			(el: HTMLDivElement | null) => {
				if (typeof categoryId !== "number") return;
				if (el) {
					categoryRefs.current.set(categoryId, el);
				} else {
					categoryRefs.current.delete(categoryId);
				}
			},
		[],
	);

	// Intersection observer for active category
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const categoryId = Number(
							entry.target.getAttribute("data-category-id"),
						);
						if (!Number.isNaN(categoryId)) {
							setActiveCategoryId(categoryId);
						}
					}
				}
			},
			{
				rootMargin: CATEGORY_INTERSECTION_ROOT_MARGIN,
				threshold: 0,
			},
		);

		// Observe each category section element
		for (const category of categories) {
			const element = categoryRefs.current.get(category.id);
			if (element) {
				observer.observe(element);
			}
		}

		return () => observer.disconnect();
	}, [categories]);

	return {
		activeCategoryId,
		categoryRefs,
		setCategoryRef,
		handleCategoryClick,
	};
}
