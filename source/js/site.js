(function(){
	//autocomplete init
	new google.maps.places.Autocomplete(document.getElementById('autocomplete'));

	var map,service, infowindow;
	var moreUrl = "",
		canLoad = false;

	//input handler
	$('input[type="submit"]').click(function(e){
		e.preventDefault();
		var searchQuery = $('#autocomplete').val();
		var $removeable = $('.main').find('.instagram');
		$('.main').isotope('remove', $removeable);
		init(searchQuery);
	});

	var init = function(searchQuery) {
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
			console.log(lat + ':::::' + lng)
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
		console.log(foursquareId);
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
		photoArr = [];
		$.each(data.data, function(index, photo){
			photoArr.push(photo);
		});

		displayPhotos(photoArr);
		nextPage =  data.pagination.next_max_id;
	};

	var displayPhotos = function(photos){
		$.each(photos, function(index, photo){
			//console.log(photo);
			var photoItem = $('<div class="item instagram"><a href="'+ photo.link +'" target="_blank"><img src="' + photo.images.low_resolution.url + '" width="310" height="310"/><div class="overlay"><h2>'+ photo.likes.count +' &hearts;</h2></div></a></div>');
			$('.main').isotope('insert', photoItem);
		});
		$('.instagram').hover(function(){
			$(this).find('.overlay').fadeIn('fast');
		}, function(){
			$(this).find('.overlay').fadeOut('fast');
		});
		canLoad = true;
	};

	var loadMore = function(url){
		$.ajax({
			url : url ,
			dataType : 'jsonp',
			success : processMore
		});
	};

	var processMore = function(data){
		$.each(data.data, function(index, photo){
			var photoItem = $('<div class="item instagram"><a href="'+ photo.link +'" target="_blank"><img src="' + photo.images.low_resolution.url + '" width="310" height="310"/><div class="overlay"><h2>'+ photo.likes.count +' &hearts;</h2></div></a></div>');
			$('.main').isotope('insert', photoItem);
		});
		nextPage =  data.pagination.next_max_id;
		canLoad = true;
	};

	$(window).scroll(function() {
		if($(window).scrollTop() + $(window).height() == $(document).height()) {
			if(moreUrl !== "" && canLoad === true){
				loadMore(moreUrl + "&max_id=" +  nextPage);
				canLoad = false;
				console.log('hit the bottom load more');
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
	})

	var initGrid = function(){
		//$('#loader').remove();
		$('.main').isotope({
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




