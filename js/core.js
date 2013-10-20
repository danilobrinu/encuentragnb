/* google map */
var ubigeo,
  $departments = $('#departments'),
  $provinces = $('#provinces'),
  $districts = $('#districts'),
  map,
  mapOptions,
  marker,
  serviceChannels,
  serviceChannel,
  serviceChannelLatLng,
  $buttonSearch = $('.app__screens__display__container__screen--search__form__button'),
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
        template = "<% _.each(departments, function(department) { %>";
        template += "<option value='<%= department %>'><%= department %></option>";
        template += "<% }); %>";
        $departments.html( defaultOption + _.template(template, {departments: departments}) );
        $provinces.empty();
        $districts.empty();
      }
      function loadProvinces() {
        var department = _.findWhere(ubigeo, {department: $(this).val()}),
          provinces = _.pluck(department.provinces, 'province'),
          template,
          defaultOption = '<option selected disabled></option>';
        template = "<% _.each(provinces, function(province) { %>";
        template += "<option value='<%= province %>'><%= province %></option>";
        template += "<% }); %>";
        $provinces.html( defaultOption + _.template(template, {provinces: provinces}) );
        $districts.empty();
      }
      function loadDistricts() {
        var department = _.findWhere(ubigeo, {department: $(this).val()}),
          province = _.findWhere(department.provinces, {province: $(this).val()}),
          districts = _.pluck(province.districts, 'district'),
          template,
          defaultOption = '<option selected disabled></option>';
        template = "<% _.each(districts, function(district) { %>";
        template += "<option value='<%= district %>'><%= district %></option>";
        template += "<% }); %>";
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
          lat: position.coords.latitude, 
          lng: position.coords.longitude,
          title: 'Bienvenido a BNG'
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
      resultLat = $(this).find('.lat').val(),
      resultLng = $(this).find('.lng').val();
    $('.app__screens__display__container__screen--results__layout__result').removeClass(classActiveResult);
    $(this).addClass(classActiveResult);
    serviceChannel = _.find(serviceChannels, function(serviceChannel) { return serviceChannel.lat == resultLat && serviceChannel.lng == resultLng; });
    showMap(serviceChannel);
  });
});

function showMap(serviceChannel) {
  google.maps.visualRefresh = true;
  serviceChannel = ( serviceChannel || { serviceChannel: {lat: -1, lng: -1, title: 'Bienvenido!'} });
  serviceChannelLatLng = new google.maps.LatLng(serviceChannel.lat, serviceChannel.lng);
  mapOptions = {
      zoom: 18,
      center: serviceChannelLatLng,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      mapTypeControl: false
  };
  map = new google.maps.Map(document.getElementById('gm'), mapOptions);
  marker = new google.maps.Marker({
      position: serviceChannelLatLng,
      map: map,
      title: serviceChannel.title 
  });
}

function search() {
  var serviceChannelsResults = _.filter(serviceChannels, function(serviceChannel) { return serviceChannel.district == 'santiago de surco'; }),
    template;
  template = "<% _.each(serviceChannelsResults, function(serviceChannelResult) { %>";
  template += "<div class='app__screens__display__container__screen--results__layout__result'>";
  template += "  <span class='app__screens__display__container__screen--results__layout__result__title'><%= serviceChannelResult.name %></span>";
  template += "  <span class='app__screens__display__container__screen--results__layout__result__text'><%= serviceChannelResult.address %></span>";   
  template += "  <span class='app__screens__display__container__screen--results__layout__result__text app__screens__display__container__screen--results__layout__result__text--strong'><%= serviceChannelResult.operationSchedule %></span>";
  template += "  <div class='hidden invisible ir'>";
  template += "    <input type='hidden' value='<%= serviceChannelResult.lat %>' class='lat'>";
  template += "    <input type='hidden' value='<%= serviceChannelResult.lng %>' class='lng'>";
  template += "  </div>";
  template += "</div>";
  template += "<% }); %>";
  /* load template */
  $('.app__screens__display__container__screen--results__layout').html( _.template(template, {serviceChannelsResults: serviceChannelsResults}) );
}

/* app */
var $appShowButton = $('.app__show-button'),
    $appScreens = $('.app__screens'),
    $appScreensDisplayContainer = $('.app__screens__display__container'),
    $buttonScreenSearchShow = $('.app__screens__buttons__button--search'),
    $buttonScreenResultsShow = $('.app__screens__buttons__button--results'),
    $buttonScreenLegendShow = $('.app__screens__buttons__button--legend');
/* load events */
$appShowButton.on('click', function() { $(this).find('.app__show-button__icon').toggleClass('icon-arrow-down').toggleClass('icon-arrow-up'); $appScreens.slideToggle(); });
$buttonScreenSearchShow.on('click', {index: 0}, showScreen);
$buttonScreenResultsShow.on('click', {index: 1}, showScreen);
$buttonScreenLegendShow.on('click', {index: 2}, showScreen);

function showScreen(e) {
  var targetX = e.data.index * -280;
  $appScreensDisplayContainer.animate({'left': targetX});
}