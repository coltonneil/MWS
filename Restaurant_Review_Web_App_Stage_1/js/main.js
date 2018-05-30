// register the service worker in the root
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(function (registration) {
      console.log('Service Worker registration successful with scope: ',
        registration.scope);
    })
    .catch(function (err) {
      console.log('Service Worker registration failed: ', err);
    });
}


let restaurants,
  neighborhoods,
  cuisines;
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  let mapDiv = document.getElementById('map')
  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };
  self.map = new google.maps.Map(mapDiv, {
    zoom: 12,
    center: loc,
    scrollwheel: false
  });
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach((restaurant, index) => {
    ul.append(createRestaurantHTML(restaurant, index));
  });
  addMarkersToMap();
  checkLazyLoader();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant, index) => {
  const li = document.createElement('li');
  const image = document.createElement('img');
  let lazyLoadClass = ""
  if (index > 4) {
    lazyLoadClass = " lazyLoad"
    image.setAttribute('src', DBHelper.loadingImage())
    image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant))
  } else {
    image.setAttribute('src', DBHelper.imageUrlForRestaurant(restaurant))
  }
  image.className = 'restaurant-img' + lazyLoadClass;
  image.setAttribute('alt', restaurant.alt)
  li.append(image);

  const infoContainer = document.createElement('div');
  infoContainer.className = 'restaurant-info';
  li.append(infoContainer);

  const name = document.createElement('h2');
  name.className = 'restaurant-name';
  name.innerHTML = restaurant.name;
  infoContainer.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.className = 'restaurant-neighborhood';
  neighborhood.innerHTML = restaurant.neighborhood;
  infoContainer.append(neighborhood);

  const address = document.createElement('p');
  address.className = 'restaurant-address';
  address.innerHTML = restaurant.address;
  infoContainer.append(address);

  const linkContainer = document.createElement('div');
  linkContainer.className = 'restaurant-link';
  linkContainer.setAttribute('title', 'View details about ' + restaurant.name)
  li.append(linkContainer);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  linkContainer.append(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}
/*
 Add click listener for filter button
*/

toggleFilters = () => {
  let filterOptions = document.getElementsByClassName('filter-options');
  filterOptions[0].classList.toggle("closed");
};

window.onscroll = function () {
  stopFilterButton();
  checkLazyLoader();
}
window.onresize = function () {
  stopFilterButton();
  checkLazyLoader();
}

stopFilterButton = () => {
  let filterButton = document.getElementById('filter-button'),
    filterButtonBottom = filterButton.getBoundingClientRect().bottom,
    footer = document.getElementById('footer'),
    footerTop = footer.getBoundingClientRect().top,
    footerHeight = footer.getBoundingClientRect().height,
    windowHeight = document.documentElement.clientHeight;
  if (window.innerWidth >= 1440) {
    filterButton.style.position = "fixed";
    filterButton.style.bottom = '89px';
    return;
  }
  if (footerTop <= filterButtonBottom + 15 && filterButton.style.position != 'absolute') {
    filterButton.style.position = "absolute";
    filterButton.style.bottom = (footerHeight + 15) + 'px';
  }
  if (footerTop > windowHeight && filterButton.style.position != 'fixed') {
    filterButton.style.position = "fixed";
    filterButton.style.bottom = '15px';
  }
}
checkLazyLoader = () => {
  let lazyImages = document.getElementsByClassName('lazyLoad');
  for (let elem of lazyImages) {
    if (elementInViewport(elem)) {
      loadImg(elem);
    }
  }
}
loadImg = (imgElem) => {
  imgSrc = imgElem.getAttribute('data-src');
  imgElem.setAttribute('src', imgSrc);
  imgElem.classList.remove('lazyLoad');
}

elementInViewport = (elem) => {
  let top = elem.offsetTop,
    left = elem.offsetLeft,
    width = elem.offsetWidth,
    height = elem.offsetHeight;

  while (elem.offsetParent) {
    elem = elem.offsetParent;
    top += elem.offsetTop;
    left += elem.offsetLeft;
  }

  return (
    top < (window.pageYOffset + window.innerHeight) &&
    left < (window.pageXOffset + window.innerWidth) &&
    (top + height) > window.pageYOffset &&
    (left + width) > window.pageXOffset
  );
}