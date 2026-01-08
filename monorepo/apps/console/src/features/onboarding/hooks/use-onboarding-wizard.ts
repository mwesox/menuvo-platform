import { useCallback, useState } from "react";
import type {
	AddressSlideInput,
	BusinessSlideInput,
	ContactSlideInput,
	OwnerSlideInput,
	StoreNameSlideInput,
} from "../schemas";

// Slide indices:
// 0 = Welcome
// 1 = Business name
// 2 = Owner name
// 3 = Contact (email + phone)
// 4 = Store name
// 5 = Address
// 6 = Review
export type SlideIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_SLIDES = 7;
const TOTAL_QUESTIONS = 5; // Excluding welcome and review

// Collected data from all slides
export interface OnboardingData {
	merchant: {
		name: string;
		ownerName: string;
		email: string;
		phone: string;
	};
	store: {
		name: string;
		street: string;
		city: string;
		postalCode: string;
		country: string;
	};
}

const initialData: OnboardingData = {
	merchant: {
		name: "",
		ownerName: "",
		email: "",
		phone: "",
	},
	store: {
		name: "",
		street: "",
		city: "",
		postalCode: "",
		country: "Deutschland",
	},
};

export function useOnboardingWizard() {
	const [currentSlide, setCurrentSlide] = useState<SlideIndex>(0);
	const [direction, setDirection] = useState<1 | -1>(1);
	const [data, setData] = useState<OnboardingData>(initialData);

	const goToNext = useCallback(() => {
		setDirection(1);
		setCurrentSlide(
			(prev) => Math.min(prev + 1, TOTAL_SLIDES - 1) as SlideIndex,
		);
	}, []);

	const goToPrevious = useCallback(() => {
		setDirection(-1);
		setCurrentSlide((prev) => Math.max(prev - 1, 0) as SlideIndex);
	}, []);

	const goToSlide = useCallback(
		(slide: SlideIndex) => {
			setDirection(slide > currentSlide ? 1 : -1);
			setCurrentSlide(slide);
		},
		[currentSlide],
	);

	// Slide completion handlers - each slide calls its handler on successful validation
	const completeBusinessSlide = useCallback(
		(slideData: BusinessSlideInput) => {
			setData((prev) => ({
				...prev,
				merchant: { ...prev.merchant, name: slideData.name },
			}));
			goToNext();
		},
		[goToNext],
	);

	const completeOwnerSlide = useCallback(
		(slideData: OwnerSlideInput) => {
			setData((prev) => ({
				...prev,
				merchant: { ...prev.merchant, ownerName: slideData.ownerName },
			}));
			goToNext();
		},
		[goToNext],
	);

	const completeContactSlide = useCallback(
		(slideData: ContactSlideInput) => {
			setData((prev) => ({
				...prev,
				merchant: {
					...prev.merchant,
					email: slideData.email,
					phone: slideData.phone,
				},
			}));
			goToNext();
		},
		[goToNext],
	);

	const completeStoreNameSlide = useCallback(
		(slideData: StoreNameSlideInput) => {
			setData((prev) => ({
				...prev,
				store: { ...prev.store, name: slideData.name },
			}));
			goToNext();
		},
		[goToNext],
	);

	const completeAddressSlide = useCallback(
		(slideData: AddressSlideInput) => {
			setData((prev) => ({
				...prev,
				store: {
					...prev.store,
					street: slideData.street,
					city: slideData.city,
					postalCode: slideData.postalCode,
				},
			}));
			goToNext();
		},
		[goToNext],
	);

	// Question number (1-indexed, for display)
	const questionNumber =
		currentSlide > 0 && currentSlide < TOTAL_SLIDES - 1 ? currentSlide : 0;

	return {
		// Navigation
		currentSlide,
		direction,
		goToNext,
		goToPrevious,
		goToSlide,

		// Slide state
		isWelcome: currentSlide === 0,
		isReview: currentSlide === TOTAL_SLIDES - 1,
		isFirstSlide: currentSlide === 0,
		isLastSlide: currentSlide === TOTAL_SLIDES - 1,
		totalSlides: TOTAL_SLIDES,
		totalQuestions: TOTAL_QUESTIONS,
		questionNumber,

		// Collected data
		data,

		// Slide completion handlers
		completeBusinessSlide,
		completeOwnerSlide,
		completeContactSlide,
		completeStoreNameSlide,
		completeAddressSlide,
	};
}

export type WizardState = ReturnType<typeof useOnboardingWizard>;
