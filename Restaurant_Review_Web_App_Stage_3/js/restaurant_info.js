// register the service worker in the root
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .catch(function (err) {
      console.log('Service Worker registration failed: ', err);
    });
}

let restaurant;
var map;


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 19,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const favorite = document.getElementById('favorite');
  favorite.className = 'is_favorite'
  favorite.setAttribute('id', 'is_favorite_img_' + restaurant.id);
  favorite.setAttribute('onclick', 'DBHelper.toggleFavorite(' + restaurant.id + ')');
  favorite.setAttribute('aria-label', 'Click to toggle favorite');
  if (typeof restaurant.is_favorite == 'string') {
    if (restaurant.is_favorite == 'true') {
      restaurant.is_favorite = true
    } else {
      restaurant.is_favorite = false
    }
  }
  favorite.setAttribute('src', restaurant.is_favorite ? "img/favorite_filled.svg" : "img/favorite_outline.svg");

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.setAttribute('src', DBHelper.imageUrlForRestaurant(restaurant) + ".jpg")
  image.setAttribute('srcset', DBHelper.imageUrlForRestaurant(restaurant) + ".webp")
  image.className = 'restaurant-img';
  image.setAttribute('alt', restaurant.alt)

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  } else {
    missingRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.className = 'open-time-day';
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.className = 'open-time-hours';
    time.innerHTML = operatingHours[key].replace(",", "</br>");
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
missingRestaurantHoursHTML = () => {
  const hoursContainer = document.getElementById('restaurant-hours-container');
  const noHoursMsg = document.createElement('div');
  noHoursMsg.className = 'no-hours';
  noHoursMsg.innerHTML = "Oops, there a no hours available for this business";
  hoursContainer.appendChild(noHoursMsg)
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (id = self.restaurant.id) => {
  DBHelper.fetchStoredReviews(id, (error, reviews) => {
    const ul = document.getElementById('reviews-list');

    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
  });

  DBHelper.fetchReviews(id, (error, reviews) => {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
  });
}

function formatDate(date) {
  date = date.split("T")[0].split("-")
  return date[1] + "/" + date[2] + "/" + date[0];
}
/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.className = 'review-name';
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.className = 'review-date';
  var reviewDate = formatDate(review.createdAt);
  date.innerHTML = reviewDate;
  li.appendChild(date);

  const svgStar = '<svg fill="#ffd055" height="48" viewBox="0 0 24 24" width="48" xmlns="http://www.w3.org/2000/svg"> <path d="M0 0h24v24H0z" fill="none" /> <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /><path d="M0 0h24v24H0z" fill="none" /></svg>'
  const rating = document.createElement('p');
  rating.className = 'review-rating';
  rating.innerHTML = `Rating: `;
  let count = 0
  while (count < review.rating) {
    rating.innerHTML += svgStar
    count++
  }
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.className = 'review-comments';
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

openModal = () => {
  var modal = document.getElementById("review-modal")
  modal.classList.add('show');
}

closeModal = () => {
  var modal = document.getElementById("review-modal");
  document.getElementById("review-name").value = "";
  document.getElementById("review-rating").value = "";
  document.getElementById("review-comment").value = "";
  document.getElementById("review-message").innerHTML = "";
  modal.classList.remove('show');
}

displayCommentLength = () => {
  var comment = document.getElementById("review-comment");
  var maxLength = comment.getAttribute("maxlength");
  var commentLengthVal = comment.value.length;
  var commentLengthDiv = document.getElementById("comment-length");
  commentLengthDiv.innerHTML = commentLengthVal + "/" + maxLength;
}

window.onscroll = function () {
  stopReviewButton();
}
window.onresize = function () {
  stopReviewButton();
}

stopReviewButton = () => {
  let reviewButton = document.getElementById('add-review-button'),
    reviewButtonBottom = reviewButton.getBoundingClientRect().bottom,
    footer = document.getElementById('footer'),
    footerTop = footer.getBoundingClientRect().top,
    footerHeight = footer.getBoundingClientRect().height,
    windowHeight = document.documentElement.clientHeight;
  if (window.innerWidth >= 1440) {
    reviewButton.style.position = "fixed";
    reviewButton.style.bottom = '89px';
    return;
  }
  if (footerTop <= reviewButtonBottom + 15 && reviewButton.style.position != 'absolute') {
    reviewButton.style.position = "absolute";
    reviewButton.style.bottom = (footerHeight + 15) + 'px';
  }
  if (footerTop > windowHeight && reviewButton.style.position != 'fixed') {
    reviewButton.style.position = "fixed";
    reviewButton.style.bottom = '15px';
  }
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