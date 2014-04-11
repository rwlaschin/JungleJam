

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
	var objectCount = 200;

	var $body;
	var $trees;

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
				console.info(" Moving to ("+x+","+y+")");
				if( Math.random() > .6 ) {
					var $tree = $mastertree.clone();
					var ydev = calculateDeviation(trees.deviation.top);
					$tree.attr("id", "object"+objectCount++);
					$tree.css( { top: Math.round(y + ydev) + "px ", 
								 left: Math.round(x + calculateDeviation(trees.deviation.left)) + "px", 
								 visibility: "visible", 
								 "z-index": Math.floor(y * 1000 + ydev * 4),
								 position: "absolute" } );
					$body.append($tree);
				}
			}
		}
	};

	var _checkObscured = function (anim, progress, remaining ) {
		var $elem = $(anim.elem);
		var point = $elem.offset();
		var $elemAtPt = $(document.elementFromPoint( point.left,point.top));
		if(  $elem.attr("id") != $elemAtPt.attr("id") 
		  && $elem.css("z-index") < $elemAtPt.css("z-index") 
		  && $elemAtPt.hasClass("opaque") == false) {
			$elemAtPt.filter(".tree").each( function(i,e) {
				var $e = $(e);
				$e.stop();
				$e.addClass("opaque");
			} );
		}
	}

	var _removeAfterAnim = function(anim) {
		var $elem = $(anim.elem);
		$elem.fadeOut( {done: function(anim) { 
							$(anim.elem).remove(); 
							} 
						} );
		var point = $elem.offset();
		var $elemAtPt = $(document.elementFromPoint( point.left,point.top));
		if($elem.attr("id") != $elemAtPt.attr("id") && $elem.css("z-index") < $elemAtPt.css("z-index") ) {
			$elemAtPt.filter(".tree").each( function(i,e) {
				var $e = $(e);
				$e.stop();
				$e.fadeTo(75, 1, function() { $(this).removeClass("opaque")});
			} );
		}
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
															$(anim.elem).animate({ left : "+=0"},{ duration: 5000,
																		done: _removeAfterAnim,
																		progress: _checkObscured 
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
			$monkey.attr("id", "object"+objectCount++);
			$monkey.attr("attached", $tree.attr("id") );
			$container.css( { top: Math.round($tree.offset().top) + "px",
						 left: Math.round(($tree.offset().left + $tree.width()/2) - $monkey.css("width")/2) + "px",
						 "z-index" : $tree.css("z-index"),
						 position: "absolute",
						 visibility : "visible" } );
			$bananna.attr("id", "object"+objectCount++);
			$monkey.css( "z-index", $tree.css("z-index") );
			$bananna.css( { "z-index" : $tree.css("z-index"), position : "relative" } )
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
			$elephant.attr("id", "object"+objectCount++);
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
			$container.css( {top: top,left: (direction=="+"?0:$body.width()) + "px", "z-index": top * 1000});
			$elephant.css( { visibility:"visible" });
			$elephant.removeClass( "reverse" );
			if( direction == '+' ) {$elephant.addClass( "reverse" );}
			if(Math.random() < .3) {
				$audio.attr('autoplay','autoplay');
			}
			$container.delay(100)
					 .animate({ left: (direction=="-"?0:$body.width()) + "px" }, 
					 	      { duration: 5000 + Math.random() * 5000,
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

	var _calculatezindex = function( row, deviation) {
		if( typeof _calculatezindex.offset === "undefined" ) {
			var width = $body.width(), height = $body.height();
			_calculatezindex.offset = { x: width/trees.rows, y: height/trees.cols };
		}
		var pos = row * _calculatezindex.offset.y;
		return Math.floor( pos * 1000 + deviation * 4 );
	};

	var _updateZorder = function(anim) {
		// get position, turn position into row
	}

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
					$player.animate(css,500,"linear");
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
		$player.css( { "z-index": _calculatezindex( pos, 0 ),
						"left": $trees.first().width(),
						"top" : $body.height(),
						"position" : "absolute",
						"display" : "inline-block",
						"visibility" : "visible"
					} );
		$body.append($player);
		$(window).on("keydown", keyDownHandler($player));
		$(window).on("keyup", function($p) { 
			var $player; 
			return function(event) {
				$("#player01").stop();
				keyDownHandler.animate.top = undefined;
				keyDownHandler.animate.left = undefined;
			} }($player) );
	};

	var initializeLevel = function() {
		$body = $('body');

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