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
      alert('LOS DATOS DE LOS CANALES DE SERVICIOS O AGENCIAS NO SE HAN PODIDO CARGAR.\nPORFAVOR VUELVA A CARGAR LA PAGINA, MUCHAS GRACIAS.');
    });
  /**
   * Initialize Ubigeo
   */
  $.getJSON('js/ubigeoGNB.json')
    .done(function(data) {
      ubigeo = data;
      loadDepartments();
      $departments.on('change', loadProvinces);
      $provinces.on('change', loadDistricts);
      function loadDepartments() {
        var departments = _.pluck(ubigeo, 'department'),
            template,
            defaultOption = '<option disabled></option>';

        template = "<% _.each(departments, function(department) { %>" +
                   "<option value='<%= department %>'><%= department %></option>" +
                   "<% }); %>";

        $departments.html( defaultOption + _.template(template, {departments: departments}) );
        $provinces.empty();
        $districts.empty();
      }
      function loadProvinces(departmentDefault) {
        var department = _.findWhere(ubigeo, {department: _.isString(departmentDefault) ? departmentDefault : $departments.val()}),
            provinces = _.pluck(department.provinces, 'province'),
            template,
            defaultOption = '<option selected disabled></option>';

        template = "<% _.each(provinces, function(province) { %>" +
                   "<option value='<%= province %>'><%= province %></option>" +
                   "<% }); %>";

        $provinces.html( defaultOption + _.template(template, {provinces: provinces}) );
        $districts.empty();
      }
      function loadDistricts(departmentDefault, provinceDefault) {
        var department = _.findWhere(ubigeo, {department: _.isString(departmentDefault) ? departmentDefault : $departments.val()}),
            province = _.findWhere(department.provinces, {province: _.isString(provinceDefault) ? provinceDefault : $provinces.val()}),
            districts = _.pluck(province.districts, 'district'),
            template,
            defaultOption = '<option selected disabled></option>';
        
        template = "<% _.each(districts, function(district) { %>" + 
                   "<option value='<%= district %>'><%= district %></option>" +
                   "<% }); %>";

        $districts.html( defaultOption + _.template(template, {districts: districts}) );
      }
      // default department and province => LIMA
      $departments.val('LIMA');
      setTimeout(function() { loadProvinces('LIMA'); }, 500);
      setTimeout(function() { $provinces.val('LIMA'); }, 500); 
      setTimeout(function() { loadDistricts('LIMA', 'LIMA'); }, 500);
    })
    .fail(function() {
      ubigeo = {};
      alert('LOS DATOS DE LA LISTA DE UBIGEO GNB NO SE HAN PODIDO CARGAR.\nPORFAVOR VUELVA A CARGAR LA PAGINA, MUCHAS GRACIAS.');
    });
  /**
   * Initialize GMap
   */
  var GMap = function() {
    showMap({
      latitude: -12.128605, 
      longitude: -76.977698,
      name: 'BIENVENIDO AL BUSCADOR DE AGENCIAS O CANALES DE SERVICIOS DE GNB'
    }, true);
  };
  GMap();
});

$buttonSearch.on('click', function() {
  search();
  $('html, body').animate({
    scrollTop: $('.app__block--results__layout__container').offset().top - 10
  }, 'slow');
  /* after search and render data - load events */
  $buttonShowMap = $('.app__block--results__layout__container__results__container__result');
  $buttonShowMap.on('click', function() {
    var result = $(this);
    var classActiveResult = 'app__block--results__layout__container__results__container__result--active',
        latitudeChosen = result.find('.latitude').val(),
        longitudeChosen = result.find('.longitude').val(),
        typeChosen = result.find('.type').val();

    $('.app__block--results__layout__container__results__container__result').removeClass(classActiveResult);
    $(this).addClass(classActiveResult);
    serviceChannel = _.find(serviceChannels, function(serviceChannel) { return serviceChannel.latitude == latitudeChosen && serviceChannel.longitude == longitudeChosen; });
    showMap(serviceChannel, typeChosen != 'CAJERO-UNICARD');
    $('html, body').animate({
      scrollTop: $('.app__block--results__layout__container__map').offset().top - 10
    }, 'slow');
  });
  /* set default first result */
  (function() { !$buttonShowMap.length > 0 || $buttonShowMap.first().click() })();
});

function showMap(serviceChannel, defaultMarker) {
  google.maps.visualRefresh = true;
  serviceChannelCoordinates = new google.maps.LatLng(serviceChannel.latitude, serviceChannel.longitude);
  mapOptions = {
    zoom: 18,
    center: serviceChannelCoordinates,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: false
  };
  map = new google.maps.Map(document.getElementById('googleMapGNB'), mapOptions);
  icon = {
    size: new google.maps.Size(36, 50),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(18, 25)
  };
  if (defaultMarker) {
    icon.url = 'img/markerGNB.png';
  } else {
    icon.url = 'img/markerUnicard.png';
  }
  marker = new google.maps.Marker({
    position: serviceChannelCoordinates,
    map: map,
    icon: icon,
    title: serviceChannel.name 
  });
}

function search() {
  var departmentChosen = $departments.val(),
      provinceChosen = $provinces.val(),
      districtChosen = $districts.val(),
      addressChosen = $address.val().toUpperCase(),
      serviceChannelsResults = _.filter(serviceChannels, function(serviceChannel) {
        var serviceChannelTypeCheckeds = $('input[name=serviceChannelType]:checked');
        return serviceChannel.department == departmentChosen && 
               serviceChannel.province == provinceChosen && 
               serviceChannel.district == districtChosen && 
               serviceChannel.address.search(addressChosen) != -1 &&
               ( serviceChannelTypeCheckeds.length == 3 ? true : _.contains( _.pluck(serviceChannelTypeCheckeds, 'value'), serviceChannel.type) );
      }),
      template,
      results;

  template = '<% _.each(serviceChannelsResults, function(serviceChannelResult) { %>' +
             '<div class="app__block--results__layout__container__results__container__result app__block--results__layout__container__results__container__result--<%= serviceChannelResult.type %>">' +
             '  <header class="app__block--results__layout__container__results__container__result__header">' +
             '    <span><%= serviceChannelResult.type %></span> <%= serviceChannelResult.name %>' +
             '  </header>' +
             '  <p class="app__block--results__layout__container__results__container__result__data"><%= serviceChannelResult.address %></p>' +   
             '  <p class="app__block--results__layout__container__results__container__result__data"><%= serviceChannelResult.phones %></p>' +
             '  <div class="hidden invisible ir">' +
             '    <input type="hidden" value="<%= serviceChannelResult.type %>" class="type">' +
             '    <input type="hidden" value="<%= serviceChannelResult.latitude %>" class="latitude">' +
             '    <input type="hidden" value="<%= serviceChannelResult.longitude %>" class="longitude">' +
             '  </div>' +
             '</div>' +
             '<% }); %>';

  $('.app__block--results__layout__container__results__container').html( _.template(template, {serviceChannelsResults: serviceChannelsResults}) );
}

$serviceChannelAllTypes.on('click', function() {
  var checked = $(this).is(':checked');
  $serviceChannelType.attr('checked', checked);
});