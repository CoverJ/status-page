import { useState } from "react";
import {
	AlertTriangle,
	Calendar,
	ChevronDown,
	ChevronsUpDown,
	LayoutDashboard,
	LogOut,
	Menu,
	Server,
	Settings,
	Users,
	X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Navigation items for the dashboard sidebar
 */
const navItems = [
	{
		label: "Overview",
		href: "/dashboard",
		icon: LayoutDashboard,
	},
	{
		label: "Components",
		href: "/dashboard/components",
		icon: Server,
	},
	{
		label: "Incidents",
		href: "/dashboard/incidents",
		icon: AlertTriangle,
	},
	{
		label: "Maintenance",
		href: "/dashboard/maintenance",
		icon: Calendar,
	},
	{
		label: "Subscribers",
		href: "/dashboard/subscribers",
		icon: Users,
	},
	{
		label: "Settings",
		href: "/dashboard/settings",
		icon: Settings,
	},
] as const;

export interface StatusPage {
	id: string;
	name: string;
	subdomain: string;
}

export interface User {
	id: string;
	email: string;
	name?: string;
	avatarUrl?: string;
}

export interface DashboardSidebarProps {
	/**
	 * Currently active path for highlighting nav items
	 */
	currentPath: string;
	/**
	 * Current user information
	 */
	user: User;
	/**
	 * List of status pages the user has access to
	 */
	pages: StatusPage[];
	/**
	 * Currently selected page
	 */
	currentPage: StatusPage;
	/**
	 * Whether the sidebar is in loading state
	 */
	isLoading?: boolean;
}

/**
 * Skeleton loader for sidebar content
 */
function SidebarSkeleton() {
	return (
		<div className="flex flex-col gap-2 p-4">
			<div className="h-10 w-full animate-pulse rounded-md bg-muted" />
			<div className="h-px w-full bg-border my-2" />
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					key={`skeleton-${i}`}
					className="h-9 w-full animate-pulse rounded-md bg-muted"
				/>
			))}
		</div>
	);
}

/**
 * Page selector dropdown component
 */
function PageSelector({
	pages,
	currentPage,
	onPageChange,
}: {
	pages: StatusPage[];
	currentPage: StatusPage;
	onPageChange: (page: StatusPage) => void;
}) {
	if (pages.length <= 1) {
		return (
			<div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50">
				<div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-semibold">
					{currentPage.name.charAt(0).toUpperCase()}
				</div>
				<span className="font-medium text-sm truncate">{currentPage.name}</span>
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="w-full justify-between h-auto py-2"
					aria-label="Select status page"
				>
					<div className="flex items-center gap-2">
						<div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-semibold">
							{currentPage.name.charAt(0).toUpperCase()}
						</div>
						<span className="font-medium text-sm truncate">
							{currentPage.name}
						</span>
					</div>
					<ChevronsUpDown className="h-4 w-4 opacity-50" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				<DropdownMenuLabel>Switch Page</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{pages.map((page) => (
					<DropdownMenuItem
						key={page.id}
						onClick={() => onPageChange(page)}
						className={cn(
							"cursor-pointer",
							page.id === currentPage.id && "bg-accent",
						)}
					>
						<div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-semibold mr-2">
							{page.name.charAt(0).toUpperCase()}
						</div>
						<span className="truncate">{page.name}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * Navigation items component
 */
function NavItems({
	currentPath,
	onNavigate,
}: {
	currentPath: string;
	onNavigate?: () => void;
}) {
	return (
		<nav className="flex flex-col gap-1">
			{navItems.map((item) => {
				const isActive =
					currentPath === item.href ||
					(item.href !== "/dashboard" && currentPath.startsWith(item.href));
				const Icon = item.icon;

				return (
					<a
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={cn(
							"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
							isActive
								? "bg-primary text-primary-foreground"
								: "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
						)}
					>
						<Icon className="h-4 w-4" />
						{item.label}
					</a>
				);
			})}
		</nav>
	);
}

/**
 * User menu component
 */
function UserMenu({ user }: { user: User }) {
	const initials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: user.email.charAt(0).toUpperCase();

	const handleLogout = () => {
		// Navigate to logout endpoint
		window.location.href = "/api/auth/logout";
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					className="w-full justify-start gap-2 h-auto py-2 px-2"
					aria-label="User menu"
				>
					<Avatar className="h-8 w-8">
						{user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name || user.email} />}
						<AvatarFallback className="text-xs">{initials}</AvatarFallback>
					</Avatar>
					<div className="flex flex-col items-start text-left min-w-0 flex-1">
						{user.name && (
							<span className="text-sm font-medium truncate w-full">
								{user.name}
							</span>
						)}
						<span className="text-xs text-muted-foreground truncate w-full">
							{user.email}
						</span>
					</div>
					<ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						{user.name && <p className="text-sm font-medium">{user.name}</p>}
						<p className="text-xs text-muted-foreground truncate">
							{user.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleLogout}
					className="cursor-pointer text-destructive focus:text-destructive"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

/**
 * Desktop sidebar component
 */
function DesktopSidebar({
	currentPath,
	user,
	pages,
	currentPage,
	isLoading,
}: DashboardSidebarProps) {
	const handlePageChange = (page: StatusPage) => {
		// Navigate to the new page's dashboard
		window.location.href = `/dashboard?page=${page.id}`;
	};

	if (isLoading) {
		return (
			<aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-card">
				<SidebarSkeleton />
			</aside>
		);
	}

	return (
		<aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 border-r bg-card">
			{/* Logo / Brand */}
			<div className="flex h-16 items-center gap-2 px-4 border-b">
				<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
					<LayoutDashboard className="h-4 w-4 text-primary-foreground" />
				</div>
				<span className="font-semibold text-lg">Downtime</span>
			</div>

			{/* Page Selector */}
			<div className="px-4 py-4">
				<PageSelector
					pages={pages}
					currentPage={currentPage}
					onPageChange={handlePageChange}
				/>
			</div>

			<Separator />

			{/* Navigation */}
			<div className="flex-1 overflow-y-auto px-4 py-4">
				<NavItems currentPath={currentPath} />
			</div>

			<Separator />

			{/* User Menu */}
			<div className="p-4">
				<UserMenu user={user} />
			</div>
		</aside>
	);
}

/**
 * Mobile sidebar component with Sheet
 */
function MobileSidebar({
	currentPath,
	user,
	pages,
	currentPage,
	isLoading,
}: DashboardSidebarProps) {
	const [open, setOpen] = useState(false);

	const handlePageChange = (page: StatusPage) => {
		setOpen(false);
		window.location.href = `/dashboard?page=${page.id}`;
	};

	return (
		<>
			{/* Mobile Header */}
			<header className="lg:hidden sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-card px-4">
				<Button
					variant="ghost"
					size="icon"
					onClick={() => setOpen(true)}
					aria-label="Open menu"
				>
					<Menu className="h-5 w-5" />
				</Button>
				<div className="flex items-center gap-2">
					<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
						<LayoutDashboard className="h-4 w-4 text-primary-foreground" />
					</div>
					<span className="font-semibold">Downtime</span>
				</div>
			</header>

			{/* Mobile Sheet Sidebar */}
			<Sheet open={open} onOpenChange={setOpen}>
				<SheetContent side="left" className="w-72 p-0">
					<SheetHeader className="px-4 py-4 border-b">
						<SheetTitle className="flex items-center gap-2">
							<div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
								<LayoutDashboard className="h-4 w-4 text-primary-foreground" />
							</div>
							Downtime
						</SheetTitle>
					</SheetHeader>

					{isLoading ? (
						<SidebarSkeleton />
					) : (
						<>
							{/* Page Selector */}
							<div className="px-4 py-4">
								<PageSelector
									pages={pages}
									currentPage={currentPage}
									onPageChange={handlePageChange}
								/>
							</div>

							<Separator />

							{/* Navigation */}
							<div className="flex-1 overflow-y-auto px-4 py-4">
								<NavItems
									currentPath={currentPath}
									onNavigate={() => setOpen(false)}
								/>
							</div>

							<Separator />

							{/* User Menu */}
							<div className="p-4 mt-auto">
								<UserMenu user={user} />
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}

/**
 * Main DashboardSidebar component that renders both desktop and mobile versions
 */
export function DashboardSidebar(props: DashboardSidebarProps) {
	return (
		<TooltipProvider>
			<DesktopSidebar {...props} />
			<MobileSidebar {...props} />
		</TooltipProvider>
	);
}

export default DashboardSidebar;
