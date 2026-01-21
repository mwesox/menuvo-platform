import { useCallback, useState } from "react";
import type {
	AddressSlideInput,
	ContactSlideInput,
	LegalEntitySlideInput,
	LegalForm,
	OwnerSlideInput,
	StoreNameSlideInput,
} from "../schemas";
import { LEGAL_FORMS_REQUIRING_REGISTER } from "../schemas";

// Slide indices:
// 0 = Welcome
// 1 = Legal entity (legal form, company name, representative, register, VAT)
// 2 = Owner name
// 3 = Contact (email + phone)
// 4 = Store name
// 5 = Address
// 6 = Review
export type SlideIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const TOTAL_SLIDES = 7;
const TOTAL_QUESTIONS = 5; // Excluding welcome and review

// Legal entity data
export interface LegalEntityData {
	legalForm: LegalForm;
	legalFormOther: string;
	companyName: string;
	representativeName: string;
	registerCourt: string;
	registerNumber: string;
	vatId: string;
}

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
	legalEntity: LegalEntityData;
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
	legalEntity: {
		legalForm: "einzelunternehmen",
		legalFormOther: "",
		companyName: "",
		representativeName: "",
		registerCourt: "",
		registerNumber: "",
		vatId: "",
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
	const completeLegalEntitySlide = useCallback(
		(slideData: LegalEntitySlideInput) => {
			setData((prev) => ({
				...prev,
				// Set merchant name from company name (merged slide)
				merchant: { ...prev.merchant, name: slideData.companyName },
				legalEntity: {
					...prev.legalEntity,
					legalForm: slideData.legalForm,
					legalFormOther: slideData.legalFormOther || "",
					companyName: slideData.companyName,
					representativeName: slideData.representativeName,
					registerCourt: slideData.registerCourt || "",
					registerNumber: slideData.registerNumber || "",
					vatId: slideData.vatId || "",
				},
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
				// Auto-fill representative name if not already set
				legalEntity: {
					...prev.legalEntity,
					representativeName:
						prev.legalEntity.representativeName || slideData.ownerName,
				},
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

	// Check if current legal form requires register
	const requiresRegister = LEGAL_FORMS_REQUIRING_REGISTER.includes(
		data.legalEntity.legalForm,
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

		// Legal entity helpers
		requiresRegister,

		// Slide completion handlers
		completeLegalEntitySlide,
		completeOwnerSlide,
		completeContactSlide,
		completeStoreNameSlide,
		completeAddressSlide,
	};
}

export type WizardState = ReturnType<typeof useOnboardingWizard>;
