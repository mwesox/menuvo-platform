import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
	title: string;
	description?: string;
	action?: {
		label: string;
		href?: string;
		onClick?: () => void;
	};
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
				{description && (
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						{description}
					</p>
				)}
			</div>
			{action &&
				(action.href ? (
					<Button asChild>
						<Link to={action.href}>
							<Plus className="mr-2 h-4 w-4" />
							{action.label}
						</Link>
					</Button>
				) : (
					<Button onClick={action.onClick}>
						<Plus className="mr-2 h-4 w-4" />
						{action.label}
					</Button>
				))}
		</div>
	);
}
