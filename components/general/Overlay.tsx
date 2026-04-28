const Overlay = ({ emoji }: { emoji: string }) => {
	return (
		<div aria-hidden="true" className="overlay">
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
			<div className="overlay-item">{emoji}</div>
		</div>
	);
};

export default Overlay;
