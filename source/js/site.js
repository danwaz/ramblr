(function(){
	//autocomplete init
	new google.maps.places.Autocomplete(document.getElementById('autocomplete'));

	var map,service, infowindow;
	var moreUrl = "",
		canLoad = false;

	//input handler
	$('input[type="submit"]').click(function(e){
		e.preventDefault();
		var searchQuery = $('#autocomplete').val(),
			$removeable = $('#content-grid').find('.instagram');
		$('#content-grid').isotope('remove', $removeable);
		init(searchQuery);
	});

	var init = function(searchQuery) {
		$('#map').slideDown('fast');
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
	}

	var createMarker =function(lat, lng){
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(lat, lng),
			map: map
		});
	}

	var callback = function(results, status) {

		if (status == google.maps.places.PlacesServiceStatus.OK) {
			var lat = results[0].geometry.location.Xa;
			var lng = results[0].geometry.location.Ya;
			var center = new google.maps.LatLng(lat, lng);
			map.panTo(center);
			createMarker(lat, lng);
			getLocation(lat, lng);
		}
	}

	var getLocation = function(lat, lng){
		$.ajax({
			url : "https://api.foursquare.com/v2/venues/search?ll="+ lat + "," + lng +"&oauth_token=0GMVSGB5PKWRAIRHXUFBC5MSNCIV2W0ICC0QMKZFRJGNSYBH&v=20120801",
			dataType : 'jsonp',
			success : getIgLocation
		});
	}

	var getIgLocation = function(data){
		var foursquareId = data.response.venues[0].id;
		textAnimate(data.response.venues[0].name);
		$.ajax({
			url : "https://api.instagram.com/v1/locations/search?foursquare_v2_id="+ foursquareId +"&callback=?&amp;client_id=b93756e565794360942f1eba0831c90c",
			dataType : 'jsonp',
			success : processLocation
		});
	}

	var processLocation = function(data){
		var locationId = data.data[0].id;
		getPhotos("https://api.instagram.com/v1/locations/"+ locationId +"/media/recent?callback=?&amp;client_id=b93756e565794360942f1eba0831c90c");
		moreUrl = "https://api.instagram.com/v1/locations/"+ locationId +"/media/recent?callback=?&amp;client_id=b93756e565794360942f1eba0831c90c";
	}

	//instagram
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

	var processPhotos = function(data){
		var i;
		for (i = 0; i < data.data.length; i++){
			var photoItem = $('<div class="item instagram"><a href="'+ data.data[i].link +'" target="_blank"><img src="' + data.data[i].images.low_resolution.url + '" width="310" height="310"/><div class="overlay"><h2>'+ data.data[i].likes.count +' &hearts;</h2></div></a></div>');
			$('#content-grid').isotope('insert', photoItem);
		};

		$('.instagram').on({
			mouseenter : function(){
				$(this).find('.overlay').fadeIn('fast');
			},
			mouseleave : function(){
				$(this).find('.overlay').fadeOut('fast');
			}
		});

		nextPage =  data.pagination.next_max_id;
		canLoad = true;
	};

	var loadMore = function(url){
		$.ajax({
			url : url ,
			dataType : 'jsonp',
			success : processPhotos
		});
	};

	$(window).scroll(function() {
		if($(window).scrollTop() + $(window).height() == $(document).height()) {
			if(moreUrl !== "" && canLoad === true){
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

	$('#top').click(function(){
		window.scrollTo(0);
	});

	$('#welcome').find('p').on({
		mouseenter : function(){
			$('#autocomplete').focus();
		}
	});

	var textAnimate = function(name){
		var animateEl = $('#welcome');
		animateEl.css('margin-top', '30px');
		animateEl.find('h2').text(name);
		animateEl.find('p').text("(We found this by that location)");
		animateEl.fadeIn('slow');
	}

	var initGrid = function(){
		//$('#loader').remove();
		$('#content-grid').isotope({
			// options
			itemSelector : '.item',
			masonry: {
				columnWidth: 160
			},
		});
		// $('#filters a').click(function(){
		// 	var selector = $(this).attr('data-filter');
		// 	$('#container').isotope({ filter: selector });
		// 	return false;
		// });
	};
	initGrid();
})();




