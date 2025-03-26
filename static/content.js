if (!EventTarget.prototype.eventListenerList) {
	EventTarget.prototype.eventListenerList = [];

	const addEventListenerOriginal = EventTarget.prototype.addEventListener;
	EventTarget.prototype.addEventListener = function (type, listener, options) {
		addEventListenerOriginal.call(this, type, listener, options);
		if (!this.eventListenerList) {
			this.eventListenerList = [];
		}
		const newListener = { type: type, listener: listener, options: options };
		this.eventListenerList.push(newListener);
	};

	const removeEventListenerOriginal = EventTarget.prototype.removeEventListener;
	EventTarget.prototype.removeEventListener = function (type, listener, options) {
		removeEventListenerOriginal.call(this, type, listener, options);
		if (this.eventListenerList) {
			this.eventListenerList = this.eventListenerList.filter(
				(item) => !(item.type === type && item.listener === listener)
			);
		}
	};

	const style = document.createElement('style');
	style.textContent = `.gaen-knows {
	color: white !important;
	background-color: rgba(255, 0, 0, 0.25) !important;
	position: relative !important;
	z-index: 999999 !important;
	}
	.gaen-spoiler{
	text-transform: uppercase !important;
	border: 2px solid red !important;
	border-radius: 5px !important;
	text-align: center !important;
	}`;
	document.head.appendChild(style);
	console.log('Monkey patching done!');
}

function activate_overlay(dim) {
	dim.style.position = 'fixed';
	dim.style.top = '0';
	dim.style.left = '0';
	dim.style.width = '100vw';
	dim.style.height = '100vh';
	dim.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
	dim.style.zIndex = '999998';
	dim.style.pointerEvents = 'none';
	document.body.appendChild(dim);
}