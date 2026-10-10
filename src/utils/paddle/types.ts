import { Customer } from "@paddle/paddle-node-sdk";

export type PaddleCustomerResponse = {
	data?: Customer;
	error?: {
		type: string;
		code: string;
		detail: string;
		documentation_url: string;
	};
	meta: {
		request_id: string;
	};
};
