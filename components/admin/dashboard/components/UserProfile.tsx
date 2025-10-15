import { User } from "@/types";

const UserProfile = ({ user }: { user: User }) => {
	return (
		<section className="mb-8 sm:mb-12 bg-product-background rounded-3xl shadow-product-shadow border border-product-border flex flex-col md:flex-row md:items-center gap-4 sm:gap-6 md:gap-8 items-center relative overflow-hidden animate-fade-in p-4 sm:p-6 md:p-8 lg:p-10 text-sm sm:text-base md:text-lg lg:text-xl">
			<div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-product-primary/20 to-product-primary-accent/20 rounded-full blur-2xl"></div>
			<div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-product-primary/20 to-product-primary-accent/20 rounded-full blur-2xl"></div>
			<div className="flex flex-col items-center md:flex-row md:items-center w-full gap-4 sm:gap-6 md:gap-8 z-10">
				<div className="relative flex-shrink-0 flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32">
					<img
						src={user.image}
						alt="Profile"
						width={128}
						height={128}
						className="rounded-full ring-4 ring-product-primary/30 shadow-lg w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 object-cover"
					/>
					<div className="absolute -bottom-1 -right-1 sm:-bottom-1 sm:-right-0 w-4 h-4 sm:w-6 sm:h-6 md:w-7 md:h-7 bg-green-500 rounded-full border-2 border-product-background"></div>
				</div>
				<div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
					<div className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-product-foreground mb-1 font-heading">
						{user?.name && user.name !== "Unknown User"
							? `Welcome back, ${user.name}!`
							: "Welcome back!"}
					</div>
					<div className="text-product-foreground-accent flex items-center gap-2 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl break-words font-body">
						{user.email}
					</div>
				</div>
			</div>
		</section>
	);
};

export default UserProfile;
