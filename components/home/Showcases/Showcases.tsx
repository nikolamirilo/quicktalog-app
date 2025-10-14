"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { EffectCoverflow, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export default function SwiperCarousel({ data }) {
	return (
		<div className="flex items-center justify-center p-4">
			<div className="w-full max-w-7xl relative">
				<Swiper
					centeredSlides={true}
					coverflowEffect={{
						rotate: 0,
						stretch: 100,
						depth: 200,
						modifier: 1,
						scale: 0.9,
						slideShadows: false,
					}}
					effect="coverflow"
					loop={true}
					modules={[Navigation, Pagination, EffectCoverflow]}
					navigation={{ enabled: true }}
					pagination={{ enabled: true, clickable: true }}
					slidesPerView={3}
				>
					{data.map((item: { src: string; title: string }, index: number) => (
						<SwiperSlide key={`showcase-${index}`}>
							<div className="relative max-w-[360px] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-3xl h-[600px]">
								<div className="h-full flex items-center justify-center bg-gray-800">
									<iframe
										height="100%"
										src={item.src}
										title={item.title}
										width="100%"
									/>
								</div>
								<div className="absolute bottom-0 right-0 w-full p-4 bg-gray-900/80 backdrop-blur-sm h-32">
									<h3 className="text-2xl font-bold mb-4 text-white text-center truncate">
										{item.title}
									</h3>
									<Button
										className="w-full cursor-pointer"
										size="lg"
										variant="cta"
									>
										<Link href={item.src}>Visit Catalogue</Link>
									</Button>
								</div>
							</div>
						</SwiperSlide>
					))}
				</Swiper>
			</div>
		</div>
	);
}
