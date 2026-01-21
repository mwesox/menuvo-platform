import { Link as ChakraLink } from "@chakra-ui/react";
import { createLink, type LinkComponent } from "@tanstack/react-router";
import * as React from "react";

/**
 * Router-compatible Chakra Link following official TanStack Router integration pattern.
 * @see https://tanstack.com/router/latest/docs/framework/react/guide/custom-link
 */
interface ChakraLinkProps
	extends Omit<React.ComponentPropsWithoutRef<typeof ChakraLink>, "href"> {}

const ChakraLinkComponent = React.forwardRef<
	HTMLAnchorElement,
	ChakraLinkProps
>((props, ref) => {
	return <ChakraLink ref={ref} {...props} />;
});

const CreatedLinkComponent = createLink(ChakraLinkComponent);

export const RouterLink: LinkComponent<typeof ChakraLinkComponent> = (
	props,
) => {
	return <CreatedLinkComponent preload="intent" {...props} />;
};
