function onload()
{
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
    div.style.width = width + "px";
    div.style.height = height + "px";
    demoquest.resize();
}

