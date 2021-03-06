

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
				  deviation: {top:0,left:0},
				  distribution: 1 // .3
				};
	var monkeys = { count: 7 };
	var elephants = { count: 3 };
	var objectBase;
	var objectCounter = 200;
	var dimensions;

	var $body;
	var $trees;

	var collision = new function() {
		var debug = false;
		var self = this;
		var $body = $("body");
		var _width = $body.width() / trees.cols,
		    _height= $body.height() / trees.rows,
		    aRows = trees.rows-1, aCols = trees.cols-1;
		var grid = []; // moving to view with debug
		for( var i=0;i<trees.rows;i++) {
			var col = [];
			for(var j=0;j<trees.cols;j++)
				col.push([]);
			grid.push(col);
		};
		var translatePosition = function( topleft ) {
			var row = Math.floor( Math.min( Math.max(topleft.top,0) / _height, aRows) ),
			    col = Math.floor( Math.min( Math.max(topleft.left,0) / _width, aCols) );
			return { row: row, col: col};
		};
		var translateBox = function( topleft, bottomright ) {
			var position = topleft;
			var top = Math.floor( Math.min( Math.max(position.top,0) / _height, aRows) ),
			    left = Math.floor( Math.min( Math.max(position.left,0) / _width, aCols) );
			// switching 
			position = bottomright;
			var bottom = Math.floor( Math.min( Math.max(position.top,0) / _height, aRows) ),
			    right = Math.floor( Math.min( Math.max(position.left,0) / _width, aCols) );
			return { top: top, left: left, bottom: bottom, right: right};
		};
		var walkRegion = function( region, cbf ) {
			for(var row=region.top; row <= region.bottom; row++) {
				for(var col=region.left; col<=region.right;col++) {
					try{
						cbf( grid[row][col], row, col );
					} catch(e) {
						console.error("Callback threw exception", e);
					}
				}
			}
		};
		var processObjectBox = function ( selector, altpos, cbf ) {
			var processList = function( list, row, col ) {
				try{
					cbf( $selector, list, row, col );
				} catch(e) {
					console.error("Callback threw exception", e);
				}
			}
			var $selector = $(selector);
			var topleft = altpos || $selector.offset();
			var bottomright = { top: topleft.top + $selector.height(),left: topleft.left + $selector.width() };
			var box = translateBox(topleft,bottomright);
			walkRegion( box, processList );
		};
		// Debug start ---------------------------------
		this.findAll = function ( id ) {
			function find( list, row, column ) {
				$.each(list, function(i,v) {
					if( v == id ) {
						count+=1;
						console.info( "Found: " + id + " ("+i+") " + " " +row+","+column );
					} 
				});
			}
			if( debug ) {
				var count = 0;
				walkRegion( { top: 0, bottom: 9, left: 0, right: 9 }, find );
				if( count > 0 ) {
					console.info("Found: " + id + " " + count + " times");
				}
			}
		};

		// Debug end ---------------------------------
		this.addObject = function ( selector ) {
			var add = function( $selector, list, row, column ) {
				list.push($selector.attr("id"));
			}
			processObjectBox( selector, null, add);
		};
		this.removeObject = function ( selector, pos ) {
			var removeitem = function($sel,list,row,col) {
				var id = $sel.attr("id");
				var fnd = -1;
				$.each(list, function(i,v) {
					if( v == id ) {
						fnd = i; return false; 
					} });
				if(fnd > -1) { 
					var tmp = list.pop(); 
					if(fnd != list.length) {
						list[fnd] = tmp;
					} 
				} else if(debug) {
					console.error("Unable to find " + id);
				}
			}
			processObjectBox( selector, pos, removeitem);
		};
		this.getObjectsByPosition = function ( pos ) {
			// this is for mouse clicking
			var gridpos = translatePosition(pos);
			return grid[gridpos.row][gridpos.col];
		};
		this.getObjectsByRegion = function ( pos, size ) {
			var buildObjectList = function( list, row, column ) {
				$.each( list, function(i,item) {
					if( ! (item in _dup) ) {
						_list.push(item);
						_dup[item] = 1;
					}
				});
			}
			var _dup = {}, _list = [];
			var gridpos = translatePosition(pos);
			var bottomright = { top: pos.top + size.height, left: pos.left + size.width};
			var region = translateBox(pos,bottomright);
			walkRegion( region, buildObjectList );
			return _list;
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
				if( Math.random() <= trees.distribution ) {
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
					collision.findAll($tree.attr("id"));
				}
			}
		}
		objectBase = objectCounter + 200;
		objectCounter = objectBase;
	};

	var collideObjects = function( $actor, cbf ) {
		var getExtents = function( $elem, offset) {
			return { top: offset.top + $elem.height(), left: offset.left + $elem.width() };
		};
		var getExtents = function( $elem, offset) {
			return { top: offset.top + $elem.height(), left: offset.left + $elem.width() };
		};
		var aoffset = $actor.offset();
		var asize = { height:$actor.height(),width:$actor.width()};
		try {
			var aextent = getExtents($actor,aoffset);
			$.each( collision.getObjectsByRegion(aoffset,asize), function(i,id) {
				var $target = $( "#"+id);
				var toffset = $target.offset();
				var textent = getExtents($target,toffset);
				var isTopIn =    ( aoffset.top - toffset.top > 0  && aoffset.top - textent.top < 0 );
				var isBottomIn = ( aextent.top - toffset.top > 0  && aextent.top - textent.top < 0 );
				var isLeftIn =   ( aoffset.left - toffset.left > 0 && aoffset.left - textent.left < 0 );
				var isRightIn =  ( aextent.left - toffset.left > 0 && aextent.left - textent.left < 0 );
				var isTopLeftOut = !( aoffset.top - toffset.top >= 0 || aoffset.left - toffset.left <= 0 );
				var isBottomRightOut = !( aextent.top - textent.top >= 0 || aextent.left - textent.left <= 0 );
				if(    isTopIn || isLeftIn || isBottomIn || isRightIn // any point is inside
					|| (isTopLeftOut && isBottomRightOut ) ) {
					try {cbf.call($actor[0],$target[0]);}catch(e){}
				}
			});
		} catch (e) {
			// this is should never happen
			// if it does then there is a problem
			// removing objects from collision list
		}
	};

	var _checkObscured = function (anim, progress, remaining ) {
		collideObjects($(anim.elem),function(target){
			var $target = $(target);
			if( $target.hasClass("tree") 
			&&  $(this).css('z-index') < $target.css('z-index') ) {
				$target.addClass("opaque");
			}
		});
	}

	var _checkCollisions = function (anim) {
		collideObjects($(anim.elem),function(target){
			function getBottom($elem) {
				var off = $elem.offset();
				off.top += $elem.height();
				return off;
			}
			var $target = $(target);
			var $this = $(this);
			var mbottom = getBottom($this);
			var tbottom = getBottom($target);
			var direction = $this.attr("top") - $this.offset().top; // neg is up, pos is down
			if( $target.hasClass("tree") ) {
				// if going up and if bottom is lower, stop
				// if going down and bottom is higher, stop
				if(    ((mbottom.top - tbottom.top) < 5 && direction <= 0)
					|| (mbottom.top > tbottom.top && direction >= 0) ) {
					$this.stop();
console.info("Bumping into tree");
				}
			}
		});
	}

	var _removeAfterAnim = function(anim) {
		var $elem = $(anim.elem);
		$elem.find(".object").andSelf().each( function(i,e) {
			var $e = $(e);
			if( $e.attr("top") !== undefined ) {
				collision.removeObject($e, {
					top:parseInt($e.attr("top")),
					left:parseInt($e.attr("left")) 
				});
				$e.attr($e.offset()); // update to use new values for next loop
			}
		} );
		collision.addObject($elem); // adding the final position
		$elem.fadeOut( {done: function(anim) { 
								var $e = $(anim.elem);
								$e.find(".object").andSelf().each( function(i,e) {
									if( $(e).attr("top") !== undefined ) {
										collision.removeObject(e);
										collision.findAll($(e).attr("id"));
									}
								} );
								$e.remove();
							} 
						} );
		collideObjects($(anim.elem),function(target){
			var $target = $(target);
			if( $target.hasClass("tree") ) {
				$target.removeClass("opaque");
			}
		});
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

	var elephantrecord = {};
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
		// debug
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
			$elephant.attr($elephant.offset());
			collision.addObject($elephant);
			elephantrecord[$elephant.attr("id")] = [];
			elephantrecord[$elephant.attr("id")].push($elephant.offset());
			$container.delay(100)
					 .animate({ "left": (direction=="-"?0:$body.width()) + "px" }, 
						      { duration: 5000 + Math.random() * 5000,
						    	progress: function(anim) {
						    		var $e = $(anim.elem).find(".elephant");
						    		collision.removeObject($e, {
						    					top:parseInt($e.attr("top")),
						    					left:parseInt($e.attr("left"))
						    				});
						    		$e.attr($e.offset()); // update to use new values for next loop
						    		collision.addObject($e);
						    		if($e.attr("id") in elephantrecord) {
							    		elephantrecord[$e.attr("id")].push($e.offset());
							    	}
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
							$e.css('z-index', calculateZindex($e) );
							_checkCollisions(anim);
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

		// reset the number to keep from having overflow issues.
		setInterval( function() {
			var css = {};
			if( objectCounter > 100000) { 
				objectCounter = objectBase;
			}}, 10000);
	};

	initializeLevel();
})();