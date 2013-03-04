(function(factory) {
	if (typeof define === 'function' && define.amd && define.amd.jQuery) {
		// AMD. Register as anonymous module.
		define([ 'jquery' ], factory);
	} else {
		// Browser globals.
		factory(jQuery);
	}
}(function($) {
	$.fn.qrcode = function(options) {
		if (typeof options === 'string') {
			options = {
				text : options
			};
		}
		
		options = $.extend({}, {
			id : 'qrcode_canvas',
			render : "canvas",
			width : 400,
			height : 400,
			typeNumber : -1,
			correctLevel : QRErrorCorrectLevel.H,
			background : "#ffffff",
			foreground : "#000000",
			effect : 'none'
		}, options);
		
		var Module = function(x, y, w, h, fill) {
			this.x = x || 0;
			this.y = y || 0;
			this.w = w || 1;
			this.h = h || 1;
			this.fill = fill || '#AAAAAA';
			this.shape = 'rect';
		};

		Module.prototype = {
			draw : function(canvas) {
				//needs to fill gaps between tiles :(
				modifier 		= 0.2;
				
				switch (this.shape) {
					case 'rect':
						canvas.drawRect({
							  fillStyle: this.fill,
							  x: this.x, y: this.y,
							  width: this.w+modifier,
							  height: this.h+modifier,
							  fromCenter: false
							});
						
						break;
					case 'round':
//						var radius = this.w/2-modifier;
						var radius = this.w/2;

						canvas.drawArc({
							  fillStyle: this.fill,
							  x: this.x+this.w/2, y: this.y+this.w/2,
							  radius: radius
							});
						break;
					case 'rounded':
						var random_degrees = Math.floor(Math.random() * 32) - 16;
						canvas.drawRect({
							fillStyle: this.fill,
							x: this.x, y: this.y,
							width: this.w-modifier,
							height: this.h-modifier,
							fromCenter: false,
							cornerRadius: 5,
							rotate : random_degrees,
						});
						break;
					default:
						ctx.fillRect(this.x, this.y, this.w, this.h);
						break;
				}
			},
			
			contains : function(mx, my) {
				return (this.x <= mx) && (this.x + this.w >= mx) && (this.y <= my)
				&& (this.y + this.h >= my);
			}
		};
		
		var CanvasFrame = function(canvas) {
			this.canvas = (!(canvas instanceof HTMLCanvasElement)) ? this.createCanvas(canvas) : canvas;
			this.canvas_dom = this.canvas[0];
			this.width 	= options.width;
			this.height = options.height;
			//this.ctx 	= this.canvas.getContext('2d');
			
			this.redrawn	= false; // when set to false, the canvas will redraw everything
			this.modules 	= []; // the collection of things to be drawn
			this.images 	= [];
			
			this.interval = 100;
			
			var myFrame 	= this;
			
			setInterval(function() {
				myFrame.draw();
			}, myFrame.interval);
		};
		
		CanvasFrame.prototype = {
				
				createCanvas : function (parent) {
					console.log('creating canvas');
					var canvas = document.createElement('canvas');
					canvas.width = options.width;
					canvas.height = options.height;
					canvas.setAttribute("id", options.id);
					$(canvas).appendTo(parent);
					return $(canvas);
				},
				
				addModule : function (module) {
					this.modules.push(module);
				},
				
				emptyModules : function ()
				{
					this.modules.length = 0;
				},
				
				clear : function () {
//					this.canvas.clearRect(0, 0, this.width, this.height);
					this.canvas.clearCanvas();
				},
				
				draw : function () {
					if(!this.redrawn)
					{
						this.clear();
						var modules_len = this.modules.length;
						console.log('start to draw');
						if(modules_len == 0)
						{
							var qrcode = new QRCode(options.typeNumber, options.correctLevel);
							
							qrcode.addData(options.text);
							qrcode.make();
	
							// compute tileW/tileH based on options.width/options.height
							var tileW = this.width / qrcode.getModuleCount();
							var tileH = this.height / qrcode.getModuleCount();
							console.log(tileW, tileH, qrcode.getModuleCount());
							// draw in the canvas
							for ( var row = 0; row < qrcode.getModuleCount(); row++) {
								for ( var col = 0; col < qrcode.getModuleCount(); col++) {
									fillStyle = qrcode.isDark(row, col) ? options.foreground : options.background;
									
									var w = ((col + 1) * tileW) - (col * tileW);
									var h = ((row + 1) * tileW) - (row * tileW);
									
									module = new Module(Math.round(col * tileW), Math.round(row * tileH), w, h, fillStyle);
									module.shape = 'rounded';
									module.draw(this.canvas);
									this.addModule(module);
								}
							}
						} else {
							console.log('draw existing modules');
							for ( var i = 0; i < modules_len; i++) {
								this.modules[i].draw(this.canvas);
							}
						}
						this.redrawn = true;
					} else {
//						console.log('did not draw');
					}
				},
				
				getMouse : function (e) {
					var element = this.canvas_dom, offsetX = 0, offsetY = 0, mx, my;

					// Compute the total offset
					if (element.offsetParent !== undefined) {
						do {
							offsetX += element.offsetLeft;
							offsetY += element.offsetTop;
						} while ((element = element.offsetParent));
					}

					// Add padding and border style widths to offset
					// Also add the <html> offsets in case there's a position:fixed bar
					offsetX += this.stylePaddingLeft + this.styleBorderLeft + this.htmlLeft || 0;
					offsetY += this.stylePaddingTop + this.styleBorderTop + this.htmlTop || 0;
					
					mx = e.pageX - offsetX;
					my = e.pageY - offsetY;

					// We return a simple javascript object (a hash) with x and y defined
					return {
						x : mx,
						y : my
					};
				},
				
				createCode : function (content)
				{
					this.emptyModules();
					
					options.text = content;
					this.redrawn = false;
					this.draw();
				},
				
				mouseDown : function(e){
					var mouse 	= this.getMouse(e);
					var mx 		= mouse.x;
					var my 		= mouse.y;
					var modules = this.modules;
					
					var modules_len = modules.length || 0;
					
					for ( var i = modules_len - 1; i >= 0; i--) {
						if (modules[i].contains(mx, my)) {
							var mySel = modules[i];
							console.log('found');
							mySel.fill = '#FF0000';
							// Keep track of where in the object we clicked
							// so we can move it smoothly (see mousemove)
							this.redrawn = false;
							return;
						}
					}
					
					console.log('clicked on canvas ', mouse);
				},
				
		};
		
		var CanvasLayer = function () {
			
		};
		
		canvasFrame = new CanvasFrame($(this));
		
		 //binding events
		this.bind('click', function(e){canvasFrame.mouseDown(e);});
		
		return canvasFrame;
	};
}));