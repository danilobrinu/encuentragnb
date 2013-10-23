/* google map */
var ubigeo,
  $departments = $('#departments'),
  $provinces = $('#provinces'),
  $districts = $('#districts'),
  $address = $('#address'),
  $serviceChannelAllTypes = $('#serviceChannelAll'),
  $serviceChannelType = $('input[name=serviceChannelType]'),
  map,
  mapOptions,
  marker,
  icon,
  serviceChannels,
  serviceChannel,
  serviceChannelCoordinates,
  $buttonSearch = $('#buttonSearch'),
  $buttonShowMap;

$(window).on('load', function() {
  /**
   * Initialize Service Channels
   */
  $.getJSON('js/serviceChannelsGNB.json')
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
        }, true);
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
  $buttonShowMap = $('.app__block--results__layout__container__results__container__result');
  $buttonShowMap.on('click', function() {
    console.log('click');
    var classActiveResult = 'app__block--results__layout__container__results__container__result--active',
      latitudeChosen = $(this).find('.latitude').val(),
      longitudeChosen = $(this).find('.longitude').val();
    $('.app__block--results__layout__container__results__container__result').removeClass(classActiveResult);
    $(this).addClass(classActiveResult);
    serviceChannel = _.find(serviceChannels, function(serviceChannel) { return serviceChannel.latitude == latitudeChosen && serviceChannel.longitude == longitudeChosen; });
    showMap(serviceChannel, false);
  });
});

function showMap(serviceChannel, defaultMap) {
  google.maps.visualRefresh = true;
  serviceChannelCoordinates = new google.maps.LatLng(serviceChannel.latitude, serviceChannel.longitude);
  mapOptions = {
      zoom: 18,
      center: serviceChannelCoordinates,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false
  };
  map = new google.maps.Map(document.getElementById('googleMapGNB'), mapOptions);
  if (!defaultMap) {
    icon = {
      url: 'img/icon-bng.png',
      size: new google.maps.Size(40, 32),
      origin: new google.maps.Point(0,0),
      anchor: new google.maps.Point(0, 32)
    }
    marker = new google.maps.Marker({
        position: serviceChannelCoordinates,
        map: map,
        icon: icon,
        title: serviceChannel.name 
    });
  } else {
    marker = new google.maps.Marker({
        position: serviceChannelCoordinates,
        map: map,
        title: serviceChannel.name 
    });
  }
  
}

function search() {
  var departmentChosen = $departments.val(),
      provinceChosen = $provinces.val(),
      districtChosen = $districts.val(),
      addressChosen = $address.val().toUpperCase(),
      serviceChannelsResults = _.filter(serviceChannels, function(serviceChannel) {
        var $serviceChannelTypeChecked = $('input[name=serviceChannelType]:checked');
        return serviceChannel.department == departmentChosen && 
               serviceChannel.province == provinceChosen && 
               serviceChannel.district == districtChosen && 
               serviceChannel.address.search(addressChosen) != -1 &&
               ( $serviceChannelTypeChecked.length == 2 ? (serviceChannel.type == "AGENCIA" || serviceChannel.type == "CAJERO") : serviceChannel.type == $serviceChannelTypeChecked.val() );
      }),
      template,
      results;
  template = "<% _.each(serviceChannelsResults, function(serviceChannelResult) { %>" +
             "<div class='app__block--results__layout__container__results__container__result app__block--results__layout__container__results__container__result--<%= serviceChannelResult.type %>'>" +
             "  <header class='app__block--results__layout__container__results__container__result__header'>" +
             "    <span><%= serviceChannelResult.type %></span> <%= serviceChannelResult.name %>" +
             "  </header>" +
             "  <p class='app__block--results__layout__container__results__container__result__data'><%= serviceChannelResult.address %></p>" +   
             "  <p class='app__block--results__layout__container__results__container__result__data'><%= serviceChannelResult.phones %></p>" +
             "  <p class='app__block--results__layout__container__results__container__result__data'><%= serviceChannelResult.customerSchedule %></p>" +
             "  <div class='hidden invisible ir'>" +
             "    <input type='hidden' value='<%= serviceChannelResult.latitude %>' class='latitude'>" +
             "    <input type='hidden' value='<%= serviceChannelResult.longitude %>' class='longitude'>" +
             "  </div>" +
             "</div>" +
             "<% }); %>";
  $('.app__block--results__layout__container__results__container').html( _.template(template, {serviceChannelsResults: serviceChannelsResults}) );
}

$serviceChannelAllTypes.on('click', function() {
  var checked = $(this).is(':checked');
  $serviceChannelType.attr('checked', checked);
});