let listener_attached = false;
export function attach_listener() {
	if (listener_attached) return;

	// @ts-ignore
	if (process.env.NODE_ENV === 'development') return;
	chrome.runtime.onMessage.addListener(function (request, _sender, _sendResponse) {
		if (request.action === 'elementSelected') {
			ask_gaen(request.payload.element);
		}
	});

	listener_attached = true;
}

export async function ask_gaen(data: string) {
	fetch('http://localhost:8000/check-spoiler/', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ text: data })
	})
		.then((res) => res.json())
		.then((data) => {
			if (data.spoiler) {
				console.log('Spoiler detected');
				console.log(data.extracted_text);

				const spoiler = data.text.replace(
					data.extracted_text,
					`<p class="gaen-spoiler" title="${data.extracted_text.replace('"', '')}">spoiler:${data.confidence}</p>`
				);
				hide_spoiler(spoiler);
			} else {
				alert(`No spoiler detected in the text.\nConfidence: ${data.confidence}`);
			}
		})
		.catch((_err) => console.log('Error fetching data'));
}

function replace_text(repl: string) {
	const el = document.querySelector('[data-gaen-knows]');
	if (el) {
		el.innerHTML = repl;
		el.attributes.removeNamedItem('data-gaen-knows');
	}
}

function hide_spoiler(innerHTML: string) {
	// @ts-ignore
	if (process.env.NODE_ENV === 'development') return;

	console.log('Hiding spoiler');
	chrome.tabs.query({ active: true }, function (tabs) {
		chrome.scripting
			.executeScript({
				target: { tabId: tabs[0].id || -1 },
				// @ts-ignore
				func: replace_text,
				args: [innerHTML]
			})
			.then((_) => {
				console.log('Spoiler hidden');
			});
	});
}

export function select_element(model: string) {
	fetch(`http://localhost:8000/set/${model}`)
		.then((res) => res.json())
		.then((data) => console.log(data))
		.catch((_err) => console.log('Error fetching data'));

	// @ts-ignore
	if (process.env.NODE_ENV === 'development') return;
	chrome.tabs.query({ active: true }, function (tabs) {
		chrome.scripting.executeScript({
			target: { tabId: tabs[0].id || -1 },
			func: activate_element_selector
		});
	});
}

function activate_element_selector() {
	const originalEventListeners = new Map();
	const dim = document.createElement('div');

	// @ts-ignore
	activate_overlay(dim);

	function saveEventListeners(element: HTMLElement) {
		// @ts-ignore
		const listeners = element.eventListenerList;
		if (listeners && listeners.length) {
			originalEventListeners.set(element, listeners.slice());
		}
	}
	function restoreEventListeners() {
		originalEventListeners.forEach((listeners, element) => {
			// @ts-ignore
			listeners.forEach((listener) => {
				if (typeof listener === 'function')
					element.addEventListener(listener.type, listener.listener);
			});
		});
		originalEventListeners.clear();
	}

	function handleClick(event: MouseEvent) {
		event.preventDefault();
		dim.remove();

		const element = (event.target as HTMLElement) || new HTMLElement();
		element.classList.remove('gaen-knows');
		element.setAttribute('data-gaen-knows', 'true');

		const details = {
			element: element.innerHTML,
		};

		// @ts-ignore
		if (process.env.NODE_ENV === 'development') console.log('element:', element);
		else chrome.runtime.sendMessage({ action: 'elementSelected', payload: details });
		restoreEventListeners();

		// Clean up
		document.removeEventListener('click', handleClick, true);
		document.removeEventListener('mouseover', handleMouseOver);
		document.removeEventListener('mouseout', handleMouseOut);
		document.body.style.cursor = 'auto';
	}

	function handleMouseOver(event: MouseEvent) {
		const element = (event.target as HTMLElement) || new HTMLElement();
		element.classList.add('gaen-knows');
	}
	function handleMouseOut(event: MouseEvent) {
		const element = (event.target as HTMLElement) || new HTMLElement();
		element.classList.remove('gaen-knows');
	}

	saveEventListeners(document.body);
	document.addEventListener('click', handleClick, true);
	document.addEventListener('mouseover', handleMouseOver);
	document.addEventListener('mouseout', handleMouseOut);
	document.body.style.cursor = 'crosshair';
}
