export function $<T extends Element>(selector: string) {
	const element = document.querySelector<T>(selector);
	if (!element) throw new Error(`Missing ${selector}`);
	return element;
}

// A song arrives from the file picker or dropped anywhere on the page.
export function onFile(open: (file: File) => void) {
	const input = $<HTMLInputElement>("#file");
	const take = (file: File | undefined) => file && open(file);
	input.addEventListener("change", () => take(input.files?.[0]));
	addEventListener("dragover", (event) => event.preventDefault());
	addEventListener("drop", (event) => {
		event.preventDefault();
		take(event.dataTransfer?.files[0]);
	});
}
