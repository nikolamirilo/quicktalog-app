"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
					modules={[Navigation, Pagination, EffectCoverflow]}
					effect="coverflow"
					loop={true}
					coverflowEffect={{
						rotate: 0,
						stretch: 100,
						depth: 200,
						modifier: 1,
						scale: 0.9,
						slideShadows: false,
					}}
					slidesPerView={3}
					centeredSlides={true}
					navigation={{ enabled: true }}
					pagination={{ enabled: true, clickable: true }}
				>
					{data.map((item: { src: string; title: string }, idx: number) => (
						<SwiperSlide key={idx}>
							<div className="relative max-w-[360px] rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-3xl h-[600px]">
								<div className="h-full flex items-center justify-center bg-gray-800">
									<iframe
										src={item.src}
										width="100%"
										height="100%"
										title={item.title}
									/>
								</div>
								<div className="absolute bottom-0 right-0 w-full p-4 bg-gray-900/80 backdrop-blur-sm h-32">
									<h3 className="text-2xl font-bold mb-4 text-white text-center truncate">
										{item.title}
									</h3>
									<Button
										variant="cta"
										size="lg"
										className="w-full cursor-pointer"
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
