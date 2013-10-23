/* google map */
var ubigeo,
  $departments = $('#departments'),
  $provinces = $('#provinces'),
  $districts = $('#districts'),
  $address = $('#address'),
  map,
  mapOptions,
  marker,
  serviceChannels,
  serviceChannel,
  serviceChannelCoordinates,
  $buttonSearch = $('#buttonSearch'),
  $buttonShowMap;

$(window).on('load', function() {
  /**
   * Initialize Service Channels
   */
  $.getJSON('js/serviceChannels.json')
    .done(function(data) {
      serviceChannels = data;
    })
    .fail(function() {
      serviceChannels = {};
      alert('Los datos de los canales de servicio no se han podido cargar');
    });
  /**
   * Initialize Ubigeo
   */
  $.getJSON('js/ubigeo.json')
    .done(function(data) {
      ubigeo = data;
      loadDepartments();
      $departments.on('change', loadProvinces);
      $provinces.on('change', loadDistricts);
      function loadDepartments() {
        var departments = _.pluck(ubigeo, 'department'),
          template,
          defaultOption = '<option selected disabled></option>';
        template = "<% _.each(departments, function(department) { %>" +
                   "<option value='<%= department %>'><%= department %></option>" +
                   "<% }); %>";
        $departments.html( defaultOption + _.template(template, {departments: departments}) );
        $provinces.empty();
        $districts.empty();
      }
      function loadProvinces() {
        var department = _.findWhere(ubigeo, {department: $(this).val()}),
          provinces = _.pluck(department.provinces, 'province'),
          template,
          defaultOption = '<option selected disabled></option>';
        template = "<% _.each(provinces, function(province) { %>" +
                   "<option value='<%= province %>'><%= province %></option>" +
                   "<% }); %>";
        $provinces.html( defaultOption + _.template(template, {provinces: provinces}) );
        $districts.empty();
      }
      function loadDistricts() {
        var department = _.findWhere(ubigeo, {department: $departments.val()}),
          province = _.findWhere(department.provinces, {province: $(this).val()}),
          districts = _.pluck(province.districts, 'district'),
          template,
          defaultOption = '<option selected disabled></option>';
        template = "<% _.each(districts, function(district) { %>" + 
                   "<option value='<%= district %>'><%= district %></option>" +
                   "<% }); %>";
        $districts.html( defaultOption + _.template(template, {districts: districts}) );
      }
    })
    .fail(function() {
      ubigeo = {};
      alert('Los datos de la lista de ubigo personalizado no se ha podido cargar');
    });
  /**
   * Initialize GMap
   */
  var GMap = function() {
    if (navigator.geolocation) {
      var getMyPosition = function(position) {
        showMap({
          latitude: position.coords.latitude, 
          longitude: position.coords.longitude,
          name: 'BIENVENIDO A BNG'
        });
      };
      var errorHandler = function() {
        alert('Error al recoger los datos de su coordenada actual');
      };
      /* get my current coords (lat, lng) */
      navigator.geolocation.getCurrentPosition(getMyPosition, errorHandler, {maximumAge: 24 * 60 * 60 * 1000});
    } else {
      alert('Su navegador no soporta geolocalización');
    }
  };
  GMap();
});

$buttonSearch.on('click', function() {
  search();
  /* after search and render data - load events */
  $buttonShowMap = $('.app__screens__display__container__screen--results__layout__result');
  $buttonShowMap.on('click', function() {
    var classActiveResult = 'app__screens__display__container__screen--results__layout__result--active',
      latitudeChosen = $(this).find('.latitude').val(),
      longitudeChosen = $(this).find('.longitude').val();
    $('.app__screens__display__container__screen--results__layout__result').removeClass(classActiveResult);
    $(this).addClass(classActiveResult);
    serviceChannel = _.find(serviceChannels, function(serviceChannel) { return serviceChannel.latitude == latitudeChosen && serviceChannel.longitude == longitudeChosen; });
    showMap(serviceChannel);
  });
});

function showMap(serviceChannel) {
  google.maps.visualRefresh = true;
  serviceChannelCoordinates = new google.maps.LatLng(serviceChannel.latitude, serviceChannel.longitude);
  mapOptions = {
      zoom: 18,
      center: serviceChannelCoordinates,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false
  };
  map = new google.maps.Map(document.getElementById('googleMapGNB'), mapOptions);
  marker = new google.maps.Marker({
      position: serviceChannelCoordinates,
      map: map,
      title: serviceChannel.name 
  });
}

function search() {
  var departmentChosen = $departments.val(),
      provinceChosen = $provinces.val(),
      districtChosen = $districts.val(),
      addressChosen = $address.val().toUpperCase(),
      serviceChannelsResults = _.filter(serviceChannels, function(serviceChannel) {
        return serviceChannel.department == departmentChosen && serviceChannel.province == provinceChosen && serviceChannel.district == districtChosen && serviceChannel.address.search(addressChosen) != -1;
      }),
      template,
      results;
  template = "<% _.each(serviceChannelsResults, function(serviceChannelResult) { %>" +
             "<div class='app__screens__display__container__screen--results__layout__result'>" +
             "  <span class='app__screens__display__container__screen--results__layout__result__title'><%= serviceChannelResult.name %></span>" +
             "  <span class='app__screens__display__container__screen--results__layout__result__text'><%= serviceChannelResult.address %></span>" +   
             "  <span class='app__screens__display__container__screen--results__layout__result__text'><%= serviceChannelResult.phones %></span>" +
             "  <span class='app__screens__display__container__screen--results__layout__result__text app__screens__display__container__screen--results__layout__result__text--strong'><%= serviceChannelResult.customerSchedule %></span>" +
             "  <div class='hidden invisible ir'>" +
             "    <input type='hidden' value='<%= serviceChannelResult.latitude %>' class='latitude'>" +
             "    <input type='hidden' value='<%= serviceChannelResult.longitude %>' class='longitude'>" +
             "  </div>" +
             "</div>" +
             "<% }); %>";
  /* load template */
  results = "<div class='app__screens__display__container__screen--results__layout__result'>" +
            "no hay resultados, porfavor vuelva a realizar la busqueda" +
            "</div>";
  results = _.template(template, {serviceChannelsResults: serviceChannelsResults}) == '' ? results : _.template(template, {serviceChannelsResults: serviceChannelsResults});
  $('.app__block--results__layout__container__results__container').html(results);
}