declare module "money" {
	interface FxResult {
		from: (currency: string) => {
			to: (currency: string) => number;
		};
	}

	function fx(amount: number): FxResult;
	export = fx;
}
