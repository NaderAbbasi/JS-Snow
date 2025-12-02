/* JS Snow by Nader Abbasi 
 * Nader.Abbasi68@gmail.com
 */

var Cloud = (function () {
    class SnowFlake {
        constructor(container, geo) {
            this._container = container;
            this._geo = geo;
            this.flakeEl = null;
            this.isMelting = false;
            this.isUpdatingGeoCoord = false;
            this.position = { top: 0, left: 0 };
            this.movementCoefficient = SnowFlake.rand(0, Math.PI);
            this.create();
        }

        static rand(min, max, round = false) {
            const n = Math.random() * (max - min) + min;
            return round ? Math.floor(n) : n;
        }

        create() {
            this.flakeEl = document.createElement('div');
            const s = this.flakeEl.style;
            s.position = 'absolute';
            s.backgroundColor = 'white';
            s.borderRadius = '50%';
            s.willChange = 'transform, opacity';
            this.refresh();
            this._container.appendChild(this.flakeEl);
        }

        refresh() {
            const maxV = 3;
            const maxW = 10;
            this.weight = SnowFlake.rand(1, maxW);
            this.velocity = (this.weight / maxW) * maxV;

            const s = this.flakeEl.style;
            s.width = this.weight + 'px';
            s.height = this.weight + 'px';
            let opacity = SnowFlake.rand(0, 1, false);
            if (this.weight < (maxW / 4)) {
                if (opacity === 0) opacity += 0.2;
            } else if (this.weight < (maxW / 2)) {
                if (opacity < 0.5) opacity = 0.5 + opacity;
            } else {
                opacity = 1;
            }
            s.opacity = opacity;

            this.position.top = -this.weight;
            const left = SnowFlake.rand(1, this._geo.width);
            this.position.left = left;
            s.transform = `translate3d(${left}px, ${this.position.top}px, 0)`;
        }

        refreshGeoCoord(geo) {
            this._geo = geo;
            this.isUpdatingGeoCoord = true;
        }

        fall() {
            if (this.isMelting) return;
            const environmentHeight = parseInt(this._geo.height, 10);
            if (parseInt(this.position.top, 10) + this.weight > environmentHeight) {
                this.melt();
                return;
            }
            this.position.top += this.velocity;
            const air = Math.cos(this.movementCoefficient);
            this.position.left += air;
            this.flakeEl.style.transform = `translate3d(${this.position.left}px, ${this.position.top}px, 0)`;
            this.movementCoefficient += 0.01;
        }

        melt() {
            this.isMelting = true;
            const waiting = SnowFlake.rand(1, this.weight);
            const that = this;
            if (!this.flakeEl.style.opacity) this.flakeEl.style.opacity = 1;
            const timerId = setInterval(function () {
                if (that.flakeEl.style.opacity > 0 && !that.isUpdatingGeoCoord) {
                    that.flakeEl.style.opacity = Math.max(0, that.flakeEl.style.opacity - 0.1);
                } else {
                    clearInterval(timerId);
                    that.refresh();
                    that.isMelting = false;
                    that.isUpdatingGeoCoord = false;
                }
            }, waiting * 100);
        }
    }

    class CloudClass {
        constructor(environment, options = {}) {
            if (!environment) throw new Error('Environment/container required');
            this.container = environment;
            this.container.style.overflow = 'hidden';
            this.options = Object.assign({ flakes: 500, speed: 1 }, options);
            this.flakes = [];
            this._docFragment = document.createDocumentFragment();
            this._running = false;
            this._rafId = null;
            this._onResize = this._onResize.bind(this);
            this._geo = this._getGeo();
            this._createFlakes();
            window.addEventListener('resize', this._onResize);
        }

        _getGeo() {
            return {
                width: this.container.style.width || this.container.offsetWidth,
                height: this.container.style.height || this.container.offsetHeight
            };
        }

        _createFlakes() {
            const geo = this._geo;
            for (let i = 0; i < this.options.flakes; i++) {
                const f = new SnowFlake(this._docFragment, geo);
                this.flakes.push(f);
            }
            this.container.appendChild(this._docFragment);
        }

        _onResize() {
            const geo = this._getGeo();
            if (geo.width === this._geo.width && geo.height === this._geo.height) return;
            this._geo = geo;
            this.flakes.forEach(f => f.refreshGeoCoord(geo));
        }

        start() {
            if (this._running) return;
            this._running = true;
            const loop = () => {
                this.flakes.forEach(f => f.fall());
                this._rafId = requestAnimationFrame(loop);
            };
            loop();
        }

        rain() {
            this.start();
        }

        stop() {
            this._running = false;
            if (this._rafId) cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }

        destroy() {
            this.stop();
            window.removeEventListener('resize', this._onResize);
            this.flakes.forEach(f => {
                if (f.flakeEl && f.flakeEl.parentNode) f.flakeEl.parentNode.removeChild(f.flakeEl);
            });
            this.flakes = [];
        }
    }

    const Cloud = CloudClass;

    /**
     * First I used the setInterval, but it has many problems,
     * Then I simulate a timer by a loop and setTimeout,
     * but again it has some problems, so I googling and I find a better way to do animations in JS
     * More info about this:
     * https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
     */
    window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame || function (cb) { return setTimeout(cb, 1000 / 60); };
    window.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || function (id) { clearTimeout(id); };

    return Cloud;
}());
