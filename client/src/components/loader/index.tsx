import "./styles.css";

export function Loader() {
	return (
		<section className="w-screen flex items-center justify-center">
			<div className="loader-container">
				<div className="bar"></div>
				<div className="bar"></div>
				<div className="bar"></div>
				<div className="bar"></div>
			</div>
		</section>
	);
}
