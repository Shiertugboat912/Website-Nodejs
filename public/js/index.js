// carousel effect
var slideIndex = 1;
showSlides(slideIndex);

function plusSlides(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides(n) {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  if (n > slides.length) {slideIndex = 1}    
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";  
  }
  for (i = 0; i < dots.length; i++) {
      dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " active";
}
// onclick ends 

// auto slideshow
shoSlides();
function shoSlides() {
  var i;
  var slides = document.getElementsByClassName("mySlides");
  var dots = document.getElementsByClassName("dot");
  for (i = 0; i < slides.length; i++) {
    slides[i].style.display = "none";  
  }
  slideIndex++;
  if (slideIndex > slides.length) {slideIndex = 1}    
  for (i = 0; i < dots.length; i++) {
    dots[i].className = dots[i].className.replace(" active", "");
  }
  slides[slideIndex-1].style.display = "block";  
  dots[slideIndex-1].className += " active";
  setTimeout(shoSlides, 4000);
}
// autoends
//for about
window.addEventListener("scroll",function()
                       {
    var top = document.getElementById('about');
	var ypos = window.pageYOffset;
	if(ypos > 100)
		top.style.opacity = "1";
	else
		top.style.opacity = "0";
	});
//about ends
//for news
window.addEventListener("scroll",function()
                       {
    var top = document.getElementById('news');
	var ypos = window.pageYOffset;
	if(ypos > 500)
		top.style.opacity = "1";
	else
		top.style.opacity = "0";
	});


// auto scroll
var x = window.setInterval(function()
{
    var a = document.getElementById('news-cards')
    var b = a.scrollWidth - a.clientWidth;
    if(window.pageYOffset >= 550 && a.scrollLeft<=(b-2))
        {a.scrollLeft += 300;}
    else if (a.scrollLeft >= (b-2))
       { a.scrollLeft = 0;}
},2000);
//auto scroll ends
// news ends


//for testimonials
window.addEventListener("scroll",function()
                       {
    var top = document.getElementById('testimonials');
	var ypos = window.pageYOffset;
	if(ypos > 600)
		top.style.opacity = "1";
	else
		top.style.opacity = "0";
	});
// testimonials ends




