var Cloud = (function () {
    let _cloud;
    let _docFragment;

    function Cloud(environment) {
        if (!environment) {
            throw new Error('Environment or container should no be null or undefined.');
        }

        _cloud = environment;
        _cloud.style.overflow = 'hidden';
        _docFragment = document.createDocumentFragment();

        this.numOfFlakes = 500;
        this.flakes = [];
        this.init();
    }

    Cloud.prototype.init = function () {
        let geoCoord = {
            width: _cloud.style.width || _cloud.offsetWidth,
            height: _cloud.style.height || _cloud.offsetHeight
        };

        for (let i = 0; i < this.numOfFlakes; i++) {
            let f = new SnowFlake(_docFragment, geoCoord);
            f.create();

            this.flakes.push(f);
        }

        _cloud.appendChild(_docFragment);

        // when the window resized we should update the geo coord of each flakes
        window.addEventListener('resize', (el, ev) => {
            const cloudWidth = _cloud.style.width || _cloud.offsetWidth;
            const cloudHeight = _cloud.style.height || _cloud.offsetHeight;
            if (cloudWidth === geoCoord.width && cloudHeight === geoCoord.height) {
                return;
            }

            geoCoord = {
                width: cloudWidth,
                height: cloudHeight
            };
            this.flakes.forEach(f => f.refreshGeoCoord(geoCoord));
        });
    }

    Cloud.prototype.rain = function () {
        const that = this;

        function startRaining() {
            that.flakes.forEach(f => f.fallDown());
            requestAnimationFrame(startRaining)
        }

        startRaining();
    };

    /** Flake objct */

    var SnowFlake = (function () {
        let _cloud;
        let _geoCoord;
        let maxVelocity = 3;
        let maxWeight = 10;

        /** The main DOM element that reperesents a snow flake */
        this.flakeEl;

        /**
         * Shows that the current flake is in melting mode, so we should stop the running of the fallDown method
         * we checked this flag in the fallDown method. and reset its value when the melting process have done.
         */
        this.isMelting = false;

        /**
         * this is for those flakes that are in the melting mode, and in this mode they started to melting by
         * decrease the opacity. and because this done in a timer in the browser contex,
         * they stayed in the middle of their container-_cloud- (if _cloud resized and bigger), so we set this to true and
         * in that timer we checked this and stop the melting process and fallDown the flake.
         */
        this.isUpadingGeoCoord = false;

        function SnowFlake(cloud, geoCoord) {
            _cloud = cloud;
            _geoCoord = geoCoord;

            this.position = {
                top: 0,
                left: 0
            }

            this.movementCoefficient = generateRandomNumber(0, Math.PI);
        }

        // public functions

        SnowFlake.prototype.create = function () {
            this.createFlake();
            _cloud.appendChild(this.flakeEl);
        }

        SnowFlake.prototype.fallDown = function () {
            if (this.isMelting) {
                return;
            }

            // to support responsive env, I each time calculate the height
            let height = _geoCoord.height;
            let environmentHeight = parseInt(height);

            // if the flake arrived the end of its container, it should be melt
            if (parseInt(this.position.top) + this.weight > environmentHeight) {
                this.melt();
            } else {
                this.position.top += this.velocity;
                this.flakeEl.style.top = this.position.top + 'px';

                /** 
                 * to simulate the air resistance I create a little movement coefficient across the Y axis
                 * this is just to show the air resistance of each snow flake.
                */
                let airResistance = Math.cos(this.movementCoefficient);
                this.position.left += airResistance;
                this.flakeEl.style.left = this.position.left + 'px';

                /**
                 * after each movement I should change the movement coefficient to show 
                 * that each flake naturally fall down,
                 * If we don't do this, each flake fall down in a certain way (to left or to right),
                 * but with this change, each time it can be move to the right or move to the left
                 */
                this.movementCoefficient += 0.01;
            }
        }

        SnowFlake.prototype.refreshGeoCoord = function (geoCoord) {
            _geoCoord = geoCoord;
            this.isUpadingGeoCoord = true;
        }

        /*
         * Private functions 
         * To decrease the memory footprint I add these private functions to the proto object,
         * because there are many of the SnowFlake objects at a same time.
         * */

        SnowFlake.prototype.createFlake = function () {
            this.flakeEl = document.createElement('div');
            this.configFlake();
        }

        SnowFlake.prototype.configFlake = function () {
            let style = this.flakeEl.style;
            style.position = 'absolute';
            style.backgroundColor = 'white';
            style.borderRadius = '50%';
            style.margin = '2px';

            this.refreshFlake();
        }

        SnowFlake.prototype.refreshFlake = function () {
            this.weight = generateRandomNumber(1, maxWeight);
            this.velocity = (this.weight / maxWeight) * maxVelocity;

            let style = this.flakeEl.style;
            style.width = this.weight + 'px';
            style.height = this.weight + 'px';
            let opacity = generateRandomNumber(0, 1, false);

            /** we set the opacity of each flake based on its size. we do this to give a 3D perspective to the app
             * and also when the current flake begin melting, this process should be based on its size,
             * the more flake is big, the more take time to melt.
            */
            if (this.weight < (maxWeight / 4)) {
                if (opacity === 0) {
                    opacity += .2;
                }
            } else if (this.weight < (maxWeight / 2)) {
                if (opacity < .5) {
                    opacity = .5 + opacity;
                }
            } else {
                opacity = 1;
            }
            style.opacity = opacity;

            this.position.top = -this.weight;
            style.top = this.position.top + 'px';
            let left = generateRandomNumber(1, _geoCoord.width);
            style.left = left + 'px';

            this.position.left = left;
        }

        SnowFlake.prototype.dispose = function () {
            this.refreshFlake();
        }

        SnowFlake.prototype.melt = function () {
            /** To simulate melting of a flake, first we waiting for a random ms and then dispose the flake */
            this.isMelting = true;
            let waiting = generateRandomNumber(1, this.weight);
            let that = this;

            if (!this.flakeEl.style.opacity) {
                this.flakeEl.style.opacity = 1;
            }

            let timerId = setInterval(function () {
                if (that.flakeEl.style.opacity > 0 && !that.isUpadingGeoCoord) {
                    that.flakeEl.style.opacity -= 0.1;
                } else {
                    clearInterval(timerId);
                    that.refreshFlake();
                    that.isMelting = false;
                    that.isUpadingGeoCoord = false;
                }
            }, waiting * 100);
        }

        return SnowFlake;
    }());

    /** End of Private functions region */

    /** Util functions */

    function generateRandomNumber(min, max, round) {
        let num = Math.random() * (+max - +min) + +min;
        return !round ? num : Math.floor(num);
    }

    /**
     * First I used the setInterval, but it has many problems,
     * Then I simulate a timer by a loop and setTimeout,
     * but agian it has some problems, so I googling and I find a better way to do animations in JS
     * More info about this:
     * https://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
     */
    window.requestAnimationFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame
        || function (callback) { return setTimeout(callback, 1000 / 60) } // simulate calling code 60 

    window.cancelAnimationFrame = window.cancelAnimationFrame
        || window.mozCancelAnimationFrame
        || function (requestID) { clearTimeout(requestID) }

    /** End */

    return Cloud;
}());
