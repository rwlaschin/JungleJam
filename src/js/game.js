

// namespace protection
(function() {
	var clouds = { count: 4,
				   deviation: {top:4,left:4},
				   delay: 10000,
				   animations: [ { left: "-50px" },
				                 { left: "850px" }
				               ]
				};
	var trees = { rows: 10,
				  cols: 10,
				  deviation: {top:25,left:25}
				};
	var monkeys = { count: 7 };
	var elephants = { count: 3 };
	var objectCounter = 200;
	var dimensions;

	var $body;
	var $trees;

	var collision = new function() {
		var self = this;
		var $body = $("body");
		var _width = $body.width() / trees.cols,
		    _height= $body.height() / trees.rows,
		    aRows = trees.rows-1, aCols = trees.cols-1;
		var grid = [];
		for( var i=0;i<trees.rows;i++) {
			var col = [];
			for(var j=0;j<trees.cols;j++)
				col.push([]);
			grid.push(col);
		};
		this.translatePosition = function( position ) {
			var row = Math.floor( Math.min( Math.max(position.top,0) / _height, aRows) ),
			    col = Math.floor( Math.min( Math.max(position.left,0) / _width, aCols) );
			return { row: row, col: col};
		};
		this.addObject = function ( selector ) {
			var $selector = $(selector);
			var pos = $selector.offset();
			pos.top += $selector.height(); // forces all to match off of the bottom
			var gridpos = self.translatePosition(pos);
			// doesn't add based on overage
			grid[gridpos.row][gridpos.col].push( $selector.attr("id") ); // why? allocations
		};
		this.removeObject = function ( selector, pos ) {
			var removeitem = function(a,id) {
				var fnd = -1;
				$.each(a, function(i,v) {if( v == id ) {fnd = i; return false; } });
				if(fnd > -1) {var tmp = a.pop(); a[fnd] = tmp; }
				return a;
			}
			var $selector = $(selector);
			if( pos == undefined ) {
			    pos = $selector.offset();
			} 
			pos.top += $selector.height(); // forces all to match off of the bottom
			var gridpos = this.translatePosition(pos);
			// doesn't remove based on overage
			removeitem(grid[gridpos.row][gridpos.col],$selector.attr("id"));
		};
		this.getObjectsByPosition = function ( pos ) {
			var gridpos = this.translatePosition(pos);
			// doesn't return based on overage
			return grid[gridpos.row][gridpos.col];
		};
	};

	var calculateDeviation = function ( devation ) {
		return Math.random()*devation*2-devation;
	};

	var placeTrees = function () {
		// only run during level setup phase
		var $body = $('body');
		var width = $body.width(),
		   height = $body.height();
		var offset = { x: width/trees.rows, y: height/trees.cols };
		var base = {top: trees.deviation.top, left: 10};
		var $mastertree = $('#object01');
		for( var y=base.top; y<(height-$mastertree.height()/2);y+=offset.y ) {
			for( var x=base.left; x<=width;x+=offset.x ) {
				// console.info(" Moving to ("+x+","+y+")");
				if( Math.random() > .6 ) {
					var $tree = $mastertree.clone();
					var ydev = calculateDeviation(trees.deviation.top);
					$tree.attr("id", "object"+objectCounter++);
					$tree.css( { top: Math.round(y + ydev) + "px", 
								 left: Math.round(x + calculateDeviation(trees.deviation.left)) + "px", 
								 position: "absolute" } );
					$body.append($tree);
					$tree.css( { visibility: "visible", 
								 "z-index": calculateZindex($tree,ydev) } );
					collision.addObject($tree);
				}
			}
		}
	};

	var _checkObscured = function (anim, progress, remaining ) {
		var $elem = $(anim.elem);
		var point = $elem.offset();
		var $elemAtPt = $(document.elementFromPoint( point.left,point.top ));
	}

	var _removeAfterAnim = function(anim) {
		var $elem = $(anim.elem);
		$elem.fadeOut( {done: function(anim) { 
								$(anim.elem).filter("object").each( function(i,e) {
									collision.removeObject(e);
								} );
								$(anim.elem).remove();
							} 
						} );
		var point = $elem.offset();
		var $elemAtPt = $(document.elementFromPoint( point.left,point.top));
		$elemAtPt.filter(".tree").each( function(i,e) {
			var $e = $(e);
			$e.stop();
			$e.fadeTo(75, 1, function() { $(this).removeClass("opaque")});
		} );
	};

	var placeMonkeys = function(count) {
		var $mastermonkey = $('#enemy02'),
		    $masterbananna = $('#object02'),
		    $masteraudio = $("#monkeyChitter");
		var len = $trees.length;
		var placeMonkey = function() {
			var direction = Math.random()>.5?"-":"+";
			$monkey = $(this);
			$audio = $monkey.siblings('audio');
			$tree = $("#"+$monkey.attr("attached"));
			$container = $monkey.parent();
			$container.attr({"direction":direction});
			$container.css( { left: Math.round(($tree.offset().left + $tree.width()/2) - $monkey.width()/2) + "px" });
			$container.children().css( {visibility: "visible", position: "absolute"} );
			$monkey.css({ left : "0px" });
			if(Math.random() < .2) {
				$audio.attr('autoplay','autoplay');
			}
			$monkey.next().css({ left : (direction == "-"?"0px":"38px") });
			$container.fadeOut(0)
					.delay( 1000 + Math.random() * 4000 )
					.fadeIn()
					.animate({ left: direction + "=64" }, 
							{ duration: "slow", 
							  done: function(anim,jumped){
										// console.dir(anim);
										var $container = $(anim.elem);
										var $monkey = $container.find(".monkey");
										var $tree = $("#"+$monkey.attr("attached"));
										var $bananna = $monkey.next();
										var pos = $bananna.offset();
										var direction = $container.attr("direction");

										// position absolutely
										$bananna.remove();
										$bananna.css(pos);
										$body.append($bananna);
										
										$bananna.animate( { top: "+=" + ($tree.height() - $bananna.height()) + "px" },{
													duration:"slow",
													done: function(anim){
															_checkObscured(anim);
															collision.addObject(anim.elem);
															$(anim.elem).animate({ left : "+=0"},{ duration: 5000,
																		done: _removeAfterAnim
																	});
														}
													});
										$container.delay(50)
												  .animate({left: (direction=="+"?"-":"+") + "=64"}, {
												  	duration:"slow",
												  	done: function(anim) {_removeAfterAnim(anim); setTimeout( function() {placeMonkeys(1);}, 3000); }
												  });
									}
							}
					);
		};
		var addMonkey = function($tree) {
			// var $tree = $(elem);
			var $bananna = $masterbananna.clone();
			var $monkey = $mastermonkey.clone();
			var $audio = $masteraudio.clone();
			var $container = $("<div/>");
			$monkey.attr("id", "object"+objectCounter++);
			$monkey.attr("attached", $tree.attr("id") );
			$container.css( { top: Math.round($tree.offset().top) + "px",
						 left: Math.round(($tree.offset().left + $tree.width()/2) - $monkey.css("width")/2) + "px",
						 "z-index" : $tree.css('z-index'),
						 position: "absolute",
						 visibility : "visible" } );
			$bananna.attr("id", "object"+objectCounter++);
			$monkey.css( "z-index", $tree.css('z-index') );
			$bananna.css( { "z-index" : $tree.css('z-index'), position : "relative" } )
			$container.append($monkey)
					  .append($bananna)
					  .append($audio);
			$body.append($container);
			$monkey.load( placeMonkey );
		}
		while( count-- > 0 ) {
			var ind = Math.floor( Math.random() * len );
			addMonkey( $($trees[ind]) );
		}
	}

	var placeElephants = function(count) {
		$masterelephant = $("#enemy01");
		$masteraudio = $("#elephantRoar");
		var addElephant = function(row,direction) {
			var $container = $("<div/>");
			var $roar = $masteraudio.clone();
			$container.css({position:"absolute",display:"inline-block"});
			$elephant = $masterelephant.clone();
			$elephant.attr("id", "object"+objectCounter++);
			$container.append($elephant)
			          .append($roar);
			$body.append( $container );
			$elephant.load(function(){placeElephant.call(this,row,direction);});
		};
		var placeElephant = function(row,direction){
			var width = $body.width(),
				height = $body.height();
			var offset = { x: width/trees.rows, y: height/trees.cols };
			var $mastertree = $('#object01');
			$elephant = $(this);
			$audio = $elephant.next();
			$container = $elephant.parent();
			var top = row * offset.y;
			$container.css({  top: top,
							  left: (direction=="+"?0:$body.width()) + "px",
							});
			$container.css("z-index", calculateZindex($elephant));
			$elephant.css( { visibility:"visible" });
			$elephant.removeClass( "reverse" );
			if( direction == '+' ) {$elephant.addClass( "reverse" );}
			if(Math.random() < .3) {
				$audio.attr('autoplay','autoplay');
			}
			$container.attr("_left",$container.offset().left); // store the current pos
			collision.addObject($elephant);
			$container.delay(100)
					 .animate({ "left": (direction=="-"?0:$body.width()) + "px" }, 
						      { duration: 5000 + Math.random() * 5000,
						    	progress: function(anim) {
						    		$container.attr("_left",$container.css("left"));
						    		var $div = $(anim.elem);
						    		var offset = $div.offset();
						    		var $e = $div.find(".elephant");
						    		collision.removeObject($e, {top:offset.top,left:parseInt($div.attr("_left"))});
						    		$div.attr("_left",offset.left); // save
						    		collision.addObject($e);
						    	},
						    	done: function(anim){
						    		_removeAfterAnim(anim);
						    		setTimeout( function() { placeElephants(1); }, Math.floor(Math.random() * 2000 + 3000) );
						    	}});
		};
		while(count-- > 0) {
			var row = Math.floor( Math.random() * trees.rows );
			var direction = (Math.random()>.5?"-":"+");
			addElephant(row,direction);
		}
	};

	var calculateZindex = function( $selector ) {
		return Math.round( ($selector.offset().top + $selector.height()) + 100 );
	};

	var createPlayer = function() {
		var keyDownHandler = function( $p ) {
			var $player = $p;
			keyDownHandler.animate = {};
			setInterval( function() {
				var css = {};
				if( $player.is(':animated') ) {
					return;
				}
				if( keyDownHandler.animate.top != undefined ) {
					css.top = $player.offset().top + keyDownHandler.animate.top;
					keyDownHandler.animate.top = undefined;
				}
				if( keyDownHandler.animate.left != undefined ) {
					css.left = $player.offset().left + keyDownHandler.animate.left;
					keyDownHandler.animate.left = undefined;
				}
				if( $.isEmptyObject(css) == false ) {
					$player.attr( $player.offset() );
					$player.animate(css,{duration:500,
						easing:"linear",
						progress: function(anim){
							var $e = $(anim.elem);
							var offset = $e.offset();
							collision.removeObject($e,{top:parseInt($e.attr("top")),left:parseInt($e.attr("left"))});
							$e.attr( $e.offset() );
							collision.addObject($e);
							var z = calculateZindex($e);
							$e.css('z-index', z);
						}});
				}
			}, 50 );
			return function(event) {
				var down = 0, right = 0, val = 50;
				switch(event.which) {
					case 65: case 37: right = -val; break;
					case 68: case 39: right = val; break;
					case 87: case 38: down = -val; break;
					case 83: case 40: down = val; break;
					default: 
						// alert("Key Pressed: " + String.fromCharCode(event.charCode) + "\n" + "charCode: " + event.charCode);
						break;
				}
				if( down ) {
					keyDownHandler.animate.top = down;
				} else if ( right ) {
					keyDownHandler.animate.left = right;
				}
			};
		};
		var $player = $("#player").clone();
		$player.attr("id", "player01");
		$player.addClass("player");
		var pos = (trees.rows - 1);
		// add the player to the bottom left
		$player.css( {  "left": $trees.first().width(),
				"top" : $body.height(),
				"position" : "absolute" } );
		$body.append($player);
		$player.css( {  /*"z-index": calculateZindex($player),*/
						"visibility" : "visible" } );
		collision.addObject($player);
		$(window).on("keydown", keyDownHandler($player));
		$(window).on("keyup", function($p) {
			return function(event) {
				$("#player01").stop();
				keyDownHandler.animate.top = undefined;
				keyDownHandler.animate.left = undefined;
			} }($player));
	};

	var initializeLevel = function() {
		$body = $('body');
		var width = $body.width(),
		   height = $body.height();
		dimensions = { x: width/trees.rows, y: height/trees.cols };

		placeTrees();
		$trees = $('.tree').filter( function() { return ($(this).css("visibility") == "visible"); });

		{	// when level starts these need to start happening
			setTimeout( function() { placeMonkeys(monkeys.count); }, 0 );
			setTimeout( function() { placeElephants(elephants.count); }, 0 );
			createPlayer();
		}
	};

	initializeLevel();
})();