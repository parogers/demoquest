function onload()
{
    var btn = document.getElementById("close_credits");
    btn.addEventListener('click', closeCredits);
    
    var div = document.getElementById("canvas_area");
    var width = window.innerWidth-5;
    var height = window.innerHeight-5;
    div.style.width = width + "px";
    div.style.height = height + "px";

    demoquest.configure(div);

    window.addEventListener("resize", resize);

    setTimeout(resize, 100);
}

function resize()
{
    var div = document.getElementById("canvas_area");
    var width = window.innerWidth-5;
    var height = window.innerHeight-5;

    var credits = document.getElementById("credits");
    var creditsRect = credits.getBoundingClientRect();
    height -= creditsRect.height;

    div.style.width = width + "px";
    div.style.height = height + "px";
    demoquest.resize();
}

function closeCredits()
{
    var div = document.getElementById("credits");
    div.style.display = "none";
    resize();
}

document.addEventListener('deviceready', onload, false);
