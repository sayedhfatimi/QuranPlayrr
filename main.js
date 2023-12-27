$(document).ready(function() {
    ppbtn = document.getElementById('ppbtn');
    volume = document.getElementById('volume');
    player = document.getElementById('player');
    var tooltip = $('<div id="tooltip" />').css({
        position: 'absolute',
        top: -25,
        left: -23,
    }).show();
	$.ajax({
        url: "http://api.globalquran.com/quran/",
        cache: false,
        dataType: 'json'
    }).done(function(data) {
		$.each(data.quranList, function(quranID, by) {
			if (by.format == 'audio') $('#reciterlist').append("<option reciter='" + quranID + "' bitrate='" + x.bitrate($.parseJSON(by.media)) + "' filetype='" + y.bitrate($.parseJSON(by.media)) + "'>" + by.english_name + "</option>");;
		});
		$.each(data.quranList, function(quranID, by) {
			if (by.format == 'text' && by.type == 'translation' && by.language_code == 'en') $("<option>").val(quranID).html(by.english_name+' '+by.native_name).appendTo('#translatorlist');
		});
	});
	setStatus();
	$("select").change(function(){
		$("#reciterlist option:selected").each(function(){
			setCookie("reciter", $(this).attr('reciter'));
			setCookie("bitrate", $(this).attr('bitrate'));
            setCookie("filetype", $(this).attr('filetype'));
			setCookie("recitername", $(this).val());
			setStatus();
		});
		$("#translatorlist option:selected").each(function(){
			setCookie("translator", $(this).attr('value'));
			displayeSurah(getCookie("lastsurahplayed"));
		});
	});
	$("#RepeatAyah").change(function(){
		player.loop = !player.loop;
	});
    $(document).on('click', '.itemholder', function() {
		setCookie("lastsurahplayedname", $(this).find('.itemtext').text());
		displaySurah($(this).find('.itemnumber').text());
        setStatus();
    });
    $(document).on('click', '.navbaritem', function() {
        if (getCookie("currentpage") == $(this).text()) {} else {
			if ($(this).hasClass('surah')) {
                getSurahList();
            } else if ($(this).hasClass('viewer')) {
                displaySurah(getCookie("lastsurahplayed"));
            }
        }
		if ($(this).hasClass('settings')){
			$("#settings").toggle();
		}
    });
    $(document).on('click', '#volume', function() {
        if (player.muted) {
            $("#volumebar").slider("option", "value", getCookie("volume"));
            player.muted = false;
        } else {
            $("#volumebar").slider("option", "value", 0);
            player.muted = true;
        }
    });
    $(document).on('click', '.ayah', function() {
        index = $(this).attr('verseno') - $('.ayah').first().attr('verseno');
        playAll(tracks, index);
    });
    player.addEventListener('durationchange', function() {
        $("#sliderbar").slider("option", "min", player.startTime);
        $("#sliderbar").slider("option", "max", player.startTime + player.duration);
		$("#sliderbar").slider("option", "step", player.duration/1000);
        $("#duration").text(player.duration.toString().toHHMMSS());
        $(".ayah[ayah|='" + getCookie("currentplayingayah") + "']").css('background-color', '#DE7878');
        $('#maincontainer').animate({
            scrollTop: $('#maincontainer').scrollTop() + ($(".ayah[ayah|='" + getCookie("currentplayingayah") + "']").position().top - $('#maincontainer').position().top) - ($('#maincontainer').height() / 2) + ($(".ayah[ayah|='" + getCookie("currentplayingayah") + "']").height() / 2)
        }, 200);
    });
    player.addEventListener('progress', function() {
        var buffered = player.buffered;
        if (buffered.length > 0) {
            var i = buffered.length;
            while (i--) {
                var width = (buffered.end(i) - buffered.start(i)) / player.duration * 250;
                $("#buffered").width(width);
            }
        }
    });
    $("#sliderbar").slider({
        orientation: "horizontal",
        range: "max",
        value: 0,
        slide: function(event, ui) {
            player.currentTime = ui.value;
            tooltip.text(ui.value.toString().toHHMMSS());
        },
        change: function(event, ui) {
            tooltip.text(ui.value.toString().toHHMMSS());
        }
    }).find(".ui-slider-handle").append(tooltip);
    $("#volumebar").slider({
        orientation: "horizontal",
        range: "max",
        min: 0,
        max: 1,
        step: 0.01,
        value: player.volume,
        slide: function(event, ui) {
            player.volume = ui.value;
        }
    });
    player.addEventListener('timeupdate', function() {
        $("#sliderbar").slider("option", "value", player.currentTime);
    });
    player.addEventListener('ended', function() {
        ppbtn.setAttribute('style', 'background-position: -41px -4px;');
        $("#sliderbar").slider("option", "value", 0);
        $(".ayah[ayah|='" + getCookie("currentplayingayah") + "']").css('background-color', '#d26161');
    });
    player.addEventListener('volumechange', function() {
        setCookie("volume", player.volume);
        if (player.volume === 0 || player.muted) {
            volume.setAttribute('style', 'background-position: -153px 0px;');
        } else {
            volume.setAttribute('style', 'background-position: -94px 0px;');
        }
    });
    player.addEventListener('ended', function() {
		if ($("#RepeatSurah").is(':checked')){
			if((index + 1) == tracks.length){
				index = -1;
			}
		}
        if ((index + 1) < tracks.length) {
            index++;
            playAll(tracks, index);
        }
    });
});

function pageload() {
	if (getCookie("lastsurahplayed")) {
		displaySurah(getCookie("lastsurahplayed"));
	} else {
		getSurahList();
	}
}
var x = {
    key: function(data) {
        for (var key in data) {
            return key;
        }
    },
    bitrate: function(quranBy) {
        bitrate = {
            'auto': 'mp3,ogg'
        };
        $.each(quranBy, function(id, mediaRow) {
            bitrate[mediaRow.kbs] = mediaRow.type;
        });
        return x.key(bitrate);
    }
};
var y = {
    key: function(data) {
        for (var key in data) {
            return data[key];
        }
    },
    bitrate: function(quranBy) {
        bitrate = {
            'auto': 'mp3,ogg'
        };
        $.each(quranBy, function(id, mediaRow) {
            bitrate[mediaRow.kbs] = mediaRow.type;
        });
        return y.key(bitrate);
    }
};

function getSurahList(search) {
    setCookie("currentpage", "surah");
    $("#search").css('visibility', 'visible');
    var DBDataCapture = $.ajax({
        url: 'getlist.php',
        type: 'GET',
        data: {
            s: search
        },
        dataType: 'json'
    });
    $("#contentcontainer").fadeOut(200, function() {
        $(this).html('');
        DBDataCapture.done(function(data) {
            $.each(data, function(i) {
                $("#contentcontainer").append("<div surahnumber='" + data[i].number + "' class='itemholder'><span class='itemnumber'>" + data[i].number.replace(/^0+/, '') + "</span><div class='itemtext'>" + data[i].name + "</div></div>");
            });
        });
    }).fadeIn(200);
	$('#header').text("Surahs");
}

function displaySurah(surahnumber) {
    setCookie("lastsurahplayed", surahnumber);
    setCookie("currentpage", "viewer");
    $("#search").css('visibility', 'hidden');
    var arabic = $.ajax({
        url: "http://api.globalquran.com/surah/" + surahnumber.replace(/^0+/, '') + "/quran-simple",
        cache: false,
        dataType: 'json'
    });
    $("#contentcontainer").fadeOut(200, function() {
        $(this).html('');
        tracks = [];
        arabic.done(function(adata) {
            $.each(adata.quran, function(i, by) {
                $.each(by, function(verseNo, line) {
                    $("#contentcontainer").append('<div class="ayah" verseno="' + verseNo + '" surah="' + line.surah + '" ayah="' + line.ayah + '"><div class="ayahnumber">' + line.surah + ' : ' + line.ayah + '</div><div class="ayahversearabic">' + line.verse + '</div><div class="ayahverseenglish"></div></div>');
                    tracks.push({
                        "verseno": verseNo
                    });
                });
            });
        });
        displayeSurah(surahnumber);
    }).fadeIn(200);
    $('#header').text(getCookie("lastsurahplayedname"));
}

function displayeSurah(surahnumber) {
    $("#contentcontainer").ready(function() {
        var english = $.ajax({
            url: "http://api.globalquran.com/surah/" + surahnumber.replace(/^0+/, '') + "/" + getCookie("translator"),
            cache: false,
            dataType: 'json'
        }).done(function(edata) {
            $.each(edata.quran, function(i, by) {
                $.each(by, function(verseNo, line) {
					$(".ayah[ayah|='" + line.ayah + "']").find('.ayahverseenglish').replaceWith('<div class="ayahverseenglish">' + line.verse + '</div>');
                });
            });
        });
    });
	        
}

function play() {
    if (player.paused) {
        player.play();
        ppbtn.setAttribute('style', 'background-position: 3px -4px;');
    } else {
        player.pause();
        ppbtn.setAttribute('style', 'background-position: -41px -4px;');
    }
}

function playAll(data, index) {
    setCookie("currentplayingayah", index + 1);
    player.src = 'http://audio.globalquran.com/' + getCookie("reciter") + '/' + getCookie("filetype") + '/' + getCookie("bitrate") + 'kbs/' + data[index].verseno + '.' + getCookie("filetype");
    play();
}

function setStatus() {
    $('#status').text(getCookie("recitername") + " - " + getCookie("lastsurahplayedname"));
}

String.prototype.toHHMMSS = function() {
    var sec_num = parseInt(this, 10);
    var hours = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);
    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    var time = hours + ':' + minutes + ':' + seconds;
    return time;
};

function getCookie(cookiename) {
    var i, x, y, Cookie = document.cookie.split(";");
    for (i = 0; i < Cookie.length; i++) {
        x = Cookie[i].substr(0, Cookie[i].indexOf("="));
        y = Cookie[i].substr(Cookie[i].indexOf("=") + 1);
        x = x.replace(/^\s+|\s+$/g, "");
        if (x == cookiename) {
            return unescape(y);
        }
    }
}

function setCookie(name, value) {
    document.cookie = name + "=" + value;
}