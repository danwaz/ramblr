$(function(){
	//autocomplete init
	new google.maps.places.Autocomplete(document.getElementById('autocomplete'));

	var map,service, infowindow;
	var moreUrl = "",
		canLoad = false,
		clientId = 'b93756e565794360942f1eba0831c90c',
		queryString = window.location.search,
		errorText = '';

	//Handles Location and Tag Searches
	var searchHandler = function(searchQuery){
		if(searchQuery !== '' && searchQuery.slice(0,1) !== "#"){
			$('#map').slideDown('fast', function(){
				init(searchQuery);
			});
		} else if(searchQuery.slice(0,1) === "#"){
			$('#map').slideUp('fast', function(){
				var animateEl = $('#welcome');
					animateEl.css('margin-top', '80px');
					animateEl.find('h2').text(searchQuery);
					animateEl.find('p').text("(Here are some photos based on your #hashtag)");
					animateEl.fadeIn('slow');

				window.setTimeout(function(){
					$('#hash-container').css({display: "none"});
				}, 200);

				getHashtags('https://api.instagram.com/v1/tags/'+ searchQuery.slice(1) +'/media/recent?callback=?&amp;client_id=' + clientId);
				moreUrl = 'https://api.instagram.com/v1/tags/'+ searchQuery.slice(1) +'/media/recent?callback=?&amp;client_id=' + clientId;
			});
		} else {
			$('#welcome').find('p').fadeOut('fast', function(){
				$(this).text('(Whoops, you forgot to type something!)').fadeIn('fast');
			});
		}
	}

	//input handler
	$('input[type="submit"], .icons-search-icon').click(function(e){
		e.preventDefault();
		e.stopPropagation();
		var searchQuery = $('#autocomplete').val(),
			$removeable = $('#content-grid').find('.instagram'),
			encodedURI = '?q=' + encodeURIComponent(searchQuery);

		//Update URL
		History.replaceState(null,null, encodedURI);

		$('#content-grid').isotope('remove', $removeable);
		searchHandler(searchQuery);

		return false;
	});

	//prevent form from submitting in IE
	$('#search').submit(function(){
		var searchQuery = $('#autocomplete').val(),
			$removeable = $('#content-grid').find('.instagram'),
			encodedURI = '?q=' + encodeURIComponent(searchQuery);
		searchHandler(searchQuery);
		return false;
	});

	//load location from query string on pageload
	(function(){
		if(queryString){
			var searchQuery = decodeURIComponent(queryString).substring(3);
			$('#autocomplete').val(searchQuery).focus();
			searchHandler(searchQuery);
		}
	})();

	//Init Google Maps
	var init = function(searchQuery) {
		$('#welcome').fadeOut('fast');
		var initCenter = new google.maps.LatLng(40,-74);
		map = new google.maps.Map(document.getElementById('map'), {
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			center : initCenter,
			zoom: 15
		});

		var request = {
			query: searchQuery
		};

		service = new google.maps.places.PlacesService(map);
		service.textSearch(request, callback);
	};

	var createMarker =function(lat, lng){
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lng),
			map: map
		});
	};

	var callback = function(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			var lng = results[0].geometry.location.lng();
			var lat = results[0].geometry.location.lat();
			var center = new google.maps.LatLng(lat, lng);
			var target = document.getElementById('welcome');
			map.panTo(center);
			createMarker(lat, lng);
			getLocation(lat, lng);
		}
	};

	//Foursquare functions
	var getLocation = function(lat, lng){
		var venueName = $('#autocomplete').val(),
			trimmedName = (venueName.indexOf(',') > -1) ? venueName.substring(0, venueName.indexOf(',')) : venueName;

		$.ajax({
			url : "https://api.foursquare.com/v2/venues/search?ll="+ lat + "," + lng +"&query="+ trimmedName +"&intent=checkin&oauth_token=0GMVSGB5PKWRAIRHXUFBC5MSNCIV2W0ICC0QMKZFRJGNSYBH&v=20120801",
			dataType : 'jsonp',
			success : getIgLocation
		});
	};

	//Instagram Functions
	var getIgLocation = function(data){
		var foursquareId = data.response.venues[0].id;
		textAnimate(data.response.venues[0].name);
		$.ajax({
			url : "https://api.instagram.com/v1/locations/search?foursquare_v2_id="+ foursquareId +"&callback=?&amp;client_id=" + clientId,
			dataType : 'jsonp',
			success : processLocation
		});
	};

	var processLocation = function(data){
		if(data.data.length < 1){
			errorText = "(Sorry, we couldn't find any photos there)";
			showErrors();
			return false;
		}

		var locationId = data.data[0].id;
		getPhotos("https://api.instagram.com/v1/locations/"+ locationId +"/media/recent?callback=?&amp;client_id=" + clientId);
		moreUrl = "https://api.instagram.com/v1/locations/"+ locationId +"/media/recent?callback=?&amp;client_id=" + clientId;
	};

	var index = 0,
		nextPage = "",
		photoArr = [];

	var getPhotos = function(url){
		$.ajax({
			url : url,
			dataType : 'jsonp',
			success : processPhotos
		});
	};

	var getHashtags = function(url){
		$.ajax({
			url : url,
			dataType : 'jsonp',
			success : processPhotos
		});
	};

	var processPhotos = function(data){
		var i;

		if(data.data.length < 1){
			errorText = "(Sorry, we couldn't find any photos there)";
			showErrors();
			return false;
		} else {
			errorText = "(We found this near that location)";
		}

		for (i = 0; i < data.data.length; i++){
			var photoItem = $('<div class="item instagram"><a href="'+ data.data[i].link +'" target="_blank"><img src="' + data.data[i].images.low_resolution.url + '" width="310" height="310"/><div class="overlay"><h2>'+ data.data[i].likes.count +' &hearts;</h2></div></a></div>');
			$('#content-grid').isotope('insert', photoItem);
		}

		$('#content-grid').on({
			mouseenter : function(){
				$(this).find('.overlay').fadeIn('fast');
			},
			mouseleave : function(){
				$(this).find('.overlay').fadeOut('fast');
			}
		}, '.instagram');

		nextPage =  data.pagination.next_max_id;
		canLoad = true;
		showErrors();
	};

	var loadMore = function(url){
		$.ajax({
			url : url ,
			dataType : 'jsonp',
			success : processPhotos
		});
	};

	//Infinite scroll + toggle 'back to top' button
	$(window).scroll(function() {
		if($(window).scrollTop() + $(window).height() >= ($(document).height() -620 )) {
			if(nextPage !== "" && canLoad === true){
				loadMore(moreUrl + "&max_id=" +  nextPage);
				canLoad = false;
			}
		}
		if($(window).scrollTop() < 200){
			if($('#top').hasClass('active')){
				$('#top').animate({"bottom" : -40});
				$('#top').removeClass('active');
			}
		} else {
			if(!$('#top').hasClass('active')){
				$('#top').animate({"bottom" : 0});
				$('#top').addClass('active');
			}
		}
	});

	//Scroll To top
	$('#top').on({
		click:function(){
			$("html, body").animate({ scrollTop: 0 }, 600);
				return false;
			}
	});

	//Search Hint
	$('#welcome').find('p').on({
		mouseenter : function(){
			$('#autocomplete').focus();
		}
	});

	//show the about section
	$('#info, #logo').on('click', function(){
		var header = $('header'),
			map = $('#map'),
			about = $('#about');
		if(header.hasClass('no-stick')){
			header.removeClass('no-stick');
			map.removeClass('expanded');
			about.slideUp('fast');
		} else {
			header.addClass('no-stick');
			map.addClass('expanded');
			about.slideDown('fast');
		}
	});

	//Auto Complete text hinting
	$('#autocomplete').on({
		keyup: function(e){
			if($(this).val().slice(0,1) === '#'){
				$('#hash-container').css({display: "block"});
				$('.pac-container').css({visibility: "hidden"});
				$('#hash-container').css({left: $('#autocomplete').offset().left});
				$('#hash-container').find('p').text('Search hashtag: ' + $(this).val());
			} else {
				$('#hash-container').css({display: "none"});
				$('.pac-container').css({visibility: "visible"});
			}
		}
	});

	//Show search text
	var textAnimate = function(name){
		var animateEl = $('#welcome');
		animateEl.css('margin-top', '30px');
		animateEl.find('h2').text(name);
		animateEl.fadeIn('slow');
	};

	var showErrors = function(){
		var animateEl = $('#welcome');
		animateEl.find('p').text(errorText);
	}

	var initGrid = function(){
		$('#content-grid').isotope({
			// options
			itemSelector : '.item',
			masonry: {
				columnWidth: 160
			}
		});
	};
	initGrid();
});
