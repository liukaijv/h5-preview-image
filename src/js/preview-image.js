/**
* ! preview-image.js - v1.0.0
* A jquery preview images plugin 
* Dependencies:
* Hammer.JS
* pinchzoom.js 
* via: https://github.com/amazeui/amazeui/blob/master/js/ui.pureview.js
*/

!function(root, factory) {
	"use strict";
	if (typeof define === 'function' && (define.amd || define.cmd)) {
		// register as anon module
		define(['jquery'], factory);
	} else {
		// invoke directly
		factory( (typeof(jQuery) != 'undefined') ? jQuery : window.Zepto );
	}
}(this, function($){
	'use strict';	

    var utils = {
        options: function (string) {
            if ($.isPlainObject(string)) {
                return string;
            }
            var start = (string ? string.indexOf('{') : -1);
            var options = {};

            if (start != -1) {
                try {
                    options = (new Function('',
                        'var json = ' + string.substr(start) +
                        '; return JSON.parse(JSON.stringify(json));'))();
                    } catch (e) {
                    }
                }
                return options;
            },
            transition : (function () {
                var animationEnd = (function () {
                    var element = window.document.body || window.document.documentElement;
                    var animEndEventNames = {
                        WebkitAnimation: 'webkitAnimationEnd',
                        MozAnimation: 'animationend',
                        OAnimation: 'oAnimationEnd oanimationend',
                        animation: 'animationend'
                    };
                    var name;
                    for (name in animEndEventNames) {
                        if (element.style[name] !== undefined) {
                            return animEndEventNames[name];
                        }
                    }
                })();
                return animationEnd && {end: animationEnd};
            })(),
            animation: (function () {
              var transitionEnd = (function () {         
                var element = window.document.body || window.document.documentElement;
                var transEndEventNames = {
                    WebkitTransition: 'webkitTransitionEnd',
                    MozTransition: 'transitionend',
                    OTransition: 'oTransitionEnd otransitionend',
                    transition: 'transitionend'
                };
                var name;
                for (name in transEndEventNames) {
                    if (element.style[name] !== undefined) {
                        return transEndEventNames[name];
                    }
                }
            })();
            return transitionEnd && {end: transitionEnd};
        })()

    };

    $.fn.emulateTransitionEnd = function (duration) {
        var called = false;
        var $el = this;

        $(this).one(utils.transition.end, function () {
            called = true;
        });

        var callback = function () {
            if (!called) {
                $($el).trigger(utils.transition.end);
            }
            $el.transitionEndTimmer = undefined;
        };
        this.transitionEndTimmer = setTimeout(callback, duration);
        return this;
    };


    $.fn.transitionEnd = function (callback) {
        var endEvent = utils.transition.end;
        var dom = this;

        function fireCallBack(e) {
            callback.call(this, e);
            endEvent && dom.off(endEvent, fireCallBack);
        }

        if (callback && endEvent) {
            dom.on(endEvent, fireCallBack);
        }

        return this;
    };

    var generateGUID = function (namespace) {
    	var uid = namespace + '-' || 'pi-';
    	do {
    		uid += Math.random().toString(36).substring(2, 7);
    	} while (document.getElementById(uid));

    	return uid;
    };

    var measureScrollbar = function () {
    	if (document.body.clientWidth >= window.innerWidth) {
    		return 0;
    	}

    	var $measure = $('<div ' +
    		'style="width: 100px;height: 100px;overflow: scroll;' +
    		'position: absolute;top: -9999px;"></div>');

    	$(document.body).append($measure);

    	var scrollbarWidth = $measure[0].offsetWidth - $measure[0].clientWidth;

    	$measure.remove();

    	return scrollbarWidth;
    };

    var imageLoader = function ($image, callback) {
    	function loaded() {
    		callback($image[0]);
    	}

    	function bindLoad() {
    		this.one('load', loaded);
    		if (/MSIE (\d+\.\d+);/.test(navigator.userAgent)) {
    			var src = this.attr('src'),
    			param = src.match(/\?/) ? '&' : '?';

    			param += 'random=' + (new Date()).getTime();
    			this.attr('src', src + param);
    		}
    	}

    	if (!$image.attr('src')) {
    		loaded();
    		return;
    	}
    	if ($image[0].complete || $image[0].readyState === 4) {
    		loaded();
    	} else {
    		bindLoad.call($image);
    	}
    };

    var PreviewImage = function (element, options) {
    	this.$element = $(element);
    	this.$body = $(document.body);
    	this.options = $.extend({}, PreviewImage.DEFAULTS, options);
    	this.$preview = $(this.options.tpl, {
    		id: generateGUID('pi-preview')
    	});

    	this.$slides = null;
    	this.transitioning = null;
    	this.scrollbarWidth = 0;

    	this.init();
    };

    PreviewImage.DEFAULTS = {
    	tpl: '<div class="pi-preview pi-preview-bar-active">' +
    	'<ul class="pi-preview-slider"></ul>' +
    	'<ul class="pi-preview-direction">' +
    	'<li class="pi-preview-prev"><a href=""></a></li>' +
    	'<li class="pi-preview-next"><a href=""></a></li></ul>' +
    	'<ol class="pi-preview-nav"></ol>' +
    	'<div class="pi-preview-bar pi-active">' +
    	'<span class="pi-preview-title"></span>' +
    	'<div><span class="pi-preview-current"></span>/' +
    	'<span class="pi-preview-total"></span></div></div>' +
    	'<div class="pi-preview-actions pi-active">' +
    	'<a href="javascript:;" class="pi-back" ' +
    	'data-pi-close="preview"></a></div>' +
    	'</div>',

    	className: {
    		prevSlide: 'pi-preview-slide-prev',
    		nextSlide: 'pi-preview-slide-next',
    		onlyOne: 'pi-preview-only',
    		active: 'pi-active',
    		barActive: 'pi-preview-bar-active',
    		activeBody: 'pi-preview-active'
    	},

    	selector: {
    		slider: '.pi-preview-slider',
    		close: '[data-pi-close="preview"]',
    		total: '.pi-preview-total',
    		current: '.pi-preview-current',
            title: '.pi-preview-title',
            direction: '.pi-preview-direction',
            actions: '.pi-preview-actions',
            bar: '.pi-preview-bar',
            pinchZoom: '.pi-pinch-zoom',
            nav: '.pi-preview-nav'
        },

        shareBtn: true,

        showDirection: false,

        target: 'img',

        weChatImagePreview: true
    };

    PreviewImage.prototype.init = function () {
    	var me = this;
    	var options = this.options;
    	var $element = this.$element;
    	var $preview = this.$preview;
    	var $slider = $preview.find(options.selector.slider);
    	var $nav = $preview.find(options.selector.nav);
        var $direction = $preview.find(options.selector.direction);
        var $slides = $([]);
        var $navItems = $([]);
        var $images = $element.find(options.target);
        var total = $images.length;
        var imgUrls = [];

        if (!total) {
          return;
      }

      if (total === 1) {
          $preview.addClass(options.className.onlyOne);
      }

      $images.each(function (i, item) {
          var src;
          var title;

          if (options.target == 'a') {
                src = item.href; // to absolute path
                title = item.title || '';
            } else {
            	src = $(item).data('rel') || item.src;
            	title = $(item).attr('alt') || '';
            }

            imgUrls.push(src);

            $slides = $slides.add($('<li><div class="pi-pinch-zoom">' +
            	'<img src="' + src + '" alt="' + title + '"/></div></li>'));
            $navItems = $navItems.add($('<li>' + (i + 1) + '</li>'));
        });

      $slider.append($slides);
      $nav.append($navItems);

      $('body').append($preview);

      $preview.find(options.selector.total).text(total);

      this.$title = $preview.find(options.selector.title);
      this.$current = $preview.find(options.selector.current);
      this.$bar = $preview.find(options.selector.bar);
      this.$actions = $preview.find(options.selector.actions);
      this.$navItems = $nav.find('li');
      this.$slides = $slider.find('li');

      if (options.shareBtn) {
          this.$actions.append('<a href="javascript:;" ' +
             'class="pi-share data-pi-toggle="share"></a>');
      }

      options.showDirection ? $direction.show(): $direction.hide();

      $slider.find(options.selector.pinchZoom).each(function () {
          $(this).data('pinchzoom', new PinchZoom($(this), {}));
          $(this).on('pz_doubletap', function (e) {               
          });
      });

      $images.on('click.preview', function (e) {
          e.preventDefault();
          var clicked = $images.index(this);

          if (options.weChatImagePreview && window.WeixinJSBridge) {
             window.WeixinJSBridge.invoke('imagePreview', {
                current: imgUrls[clicked],
                urls: imgUrls
            });
         } else {
             me.open(clicked);
         }
     });

      $preview.find('.pi-preview-direction a').
      on('click.direction.preview', function (e) {
          e.preventDefault();
          var $clicked = $(e.target).parent('li');

          if ($clicked.is('.pi-preview-prev')) {
             me.prevSlide();
         } else {
             me.nextSlide();
         }
     });

        // Nav Contorl
        this.$navItems.on('click.nav.preview', function () {
        	var index = me.$navItems.index($(this));
        	me.activate(me.$slides.eq(index));
        });

        // Close Icon
        $preview.find(options.selector.close).
        on('click.close.preview', function (e) {
        	e.preventDefault();
        	me.close();
        });

        $slider.hammer().on('click.preview', function (e) {
        	e.preventDefault();
        	me.toggleToolBar();
        }).on('swipeleft.preview', function (e) {
        	e.preventDefault();
        	me.nextSlide();
        }).on('swiperight.preview', function (e) {
        	e.preventDefault();
        	me.prevSlide();
        });

        $slider.data('hammer').get('swipe').set({
        	direction: Hammer.DIRECTION_HORIZONTAL,
        	velocity: 0.35
        });

        $(document).on('keydown.preview', $.proxy(function(e) {
        	var keyCode = e.keyCode;
        	if (keyCode == 37) {
        		this.prevSlide();
        	} else if (keyCode == 39) {
        		this.nextSlide();
        	} else if (keyCode == 27) {
        		this.close();
        	}
        }, this));

    };

    PreviewImage.prototype.activate = function ($slide) {
    	var options = this.options;
    	var $slides = this.$slides;
    	var activeIndex = $slides.index($slide);
    	var alt = $slide.find('img').attr('alt') || '';
    	var active = options.className.active;

    	imageLoader($slide.find('img'), function (image) {
    		$(image).addClass('pi-img-loaded');
    	});

    	if ($slides.find('.' + active).is($slide)) {
    		return;
    	}

    	if (this.transitioning) {
    		return;
    	}

    	this.transitioning = 1;

    	this.$title.text(alt);
    	this.$current.text(activeIndex + 1);
    	$slides.removeClass();
    	$slide.addClass(active);
    	$slides.eq(activeIndex - 1).addClass(options.className.prevSlide);
    	$slides.eq(activeIndex + 1).addClass(options.className.nextSlide);

    	this.$navItems.removeClass().
    	eq(activeIndex).addClass(options.className.active);

    	if (utils.transition) {
    		$slide.one(utils.transition.end, $.proxy(function () {
    			this.transitioning = 0;
    		}, this)).emulateTransitionEnd(300);
    	} else {
    		this.transitioning = 0;
    	}
    };

    PreviewImage.prototype.nextSlide = function () {
    	if (this.$slides.length === 1) {
    		return;
    	}

    	var $slides = this.$slides;
    	var $active = $slides.filter('.pi-active');
    	var activeIndex = $slides.index($active);
    	var rightSpring = 'pi-animation-right-spring';

    	if (activeIndex + 1 >= $slides.length) { 
    		utils.animation && $active.addClass(rightSpring).on(utils.animation.end, function () {
    			$active.removeClass(rightSpring);
    		});
    	} else {
    		this.activate($slides.eq(activeIndex + 1));
    	}
    };

    PreviewImage.prototype.prevSlide = function () {
    	if (this.$slides.length === 1) {
    		return;
    	}

    	var $slides = this.$slides;
    	var $active = $slides.filter('.pi-active');
    	var activeIndex = this.$slides.index(($active));
    	var leftSpring = 'pi-animation-left-spring';

    	if (activeIndex === 0) { 
    		utils.animation && $active.addClass(leftSpring).on(utils.animation.end, function () {
    			$active.removeClass(leftSpring);
    		});
    	} else {
    		this.activate($slides.eq(activeIndex - 1));
    	}
    };

    PreviewImage.prototype.toggleToolBar = function () {
    	this.$preview.toggleClass(this.options.className.barActive);
    };

    PreviewImage.prototype.open = function (index) {
    	var active = index || 0;
    	this.checkScrollbar();
    	this.setScrollbar();
    	this.activate(this.$slides.eq(active));
    	this.$preview.addClass(this.options.className.active);
    	this.$body.addClass(this.options.className.activeBody);
    };

    PreviewImage.prototype.close = function () {
    	var options = this.options;

    	this.$preview.removeClass(options.className.active);
    	this.$slides.removeClass();

    	function resetBody() {
    		this.$body.removeClass(options.className.activeBody);
    		this.resetScrollbar();
    	}

    	if (utils.transition.end) {
    		this.$preview.one(utils.transition.end, $.proxy(resetBody, this));
    	} else {
    		resetBody.call(this);
    	}
    };

    PreviewImage.prototype.checkScrollbar = function () {
    	this.scrollbarWidth = measureScrollbar();
    };

    PreviewImage.prototype.setScrollbar = function () {
    	var bodyPaddingRight = parseInt((this.$body.css('padding-right') || 0), 10);
    	if (this.scrollbarWidth) {
    		this.$body.css('padding-right', bodyPaddingRight + this.scrollbarWidth);
    	}
    };

    PreviewImage.prototype.resetScrollbar = function () {
    	this.$body.css('padding-right', '');
    };    

    function Plugin(option) {
    	return this.each(function () {
    		var $this = $(this);
    		var data = $this.data('preview');
    		var options = $.extend({},
    			utils.options($this.data('options')),
    			typeof option == 'object' && option);

    		if (!data) {
    			$this.data('preview', (data = new PreviewImage(this, options)));
    		}

    		if (typeof option == 'string') {
    			data[option]();
    		}
    	});
    }

    $.fn.preview = Plugin;

    return PreviewImage;

});