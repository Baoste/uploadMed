let getimg = document.getElementById("getimg");
let sendinfo = document.getElementById("sendinfo");
let num = document.getElementById("num");
let spec = document.getElementById("spec");

getimg.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true});
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: getJDImg,
        },
        (injectionResults) => {
            for (const frameResult of injectionResults)
                downloadImgs(frameResult.result);
        }
    );
});

function getJDImg() {
    var imgs = document.querySelectorAll("#spec-list ul li img");
    var imgSrcs = [];
    var zipName = "JD" + window.location.pathname.split('.')[0];
    imgSrcs.push(zipName);
    for (var i=0; i<imgs.length; i++) {
        var imgSrc = imgs[i].getAttribute("src");
        imgSrc = imgSrc.replace("/n5/", "/imgzone/");
        imgSrc = "https:" + imgSrc;
        imgSrcs.push(imgSrc);
    }
    return imgSrcs;
}

function downloadImgs(imgSrcs) {
    var zip = new JSZip();
    var zipName = imgSrcs[0];
    var imgDataList = [];
    for (let i=1; i<imgSrcs.length; i++) {
        getBase64Image(imgSrcs[i], (imgData) => {
            imgDataList.push(imgData);
        });
    }
    
    setTimeout(() => {
        for (let i=0; i<imgDataList.length; i++) {
            imgName = imgDataList[i].split('!')[0];
            imgData = imgDataList[i].split('!')[1];
            zip.file(imgName, imgData, { base64: true });
            console.log(zip);
        }
        zip.generateAsync({ type:"blob" }).then(function (content) {
            saveAs(content, zipName);
        });    
    }, 2000);
}

function getBase64Image(imgSrc, callback) {
    var imgName = imgSrc.split('/');
    imgName = imgName[imgName.length - 1];
    var image = new Image();
    let imgData = null;
    image.setAttribute("crossOrigin", "anonymous");
    image.onload = function () {
        let canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        canvas.getContext("2d").drawImage(image, 0, 0, image.width, image.height);
        var dataURL = canvas.toDataURL();
        imgData = dataURL.split(',')[1];
        callback(imgName + '!' + imgData);
    };
    image.src = imgSrc;
}


sendinfo.addEventListener("click", async () => {
    //读取填写的信息
    let medInfo = getInfo();
    console.log(medInfo);

    //执行setInfo
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true});
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: sendInfo,
        args: [medInfo],
    });
});

function getInfo() {
    productNum = num.value.trim();
    for (var i=0; i<jsonArr.length; i++)
        if (productNum == jsonArr[i].productNum) {
            spec.value = jsonArr[i].specificationOriginal;
            return {
                "approvalNum": jsonArr[i].approvalNum,
                "specification": jsonArr[i].specification,
                "productNum": jsonArr[i].productNum,
                "price": jsonArr[i].price,
                "inventory": jsonArr[i].inventory
            };
        }
}

function sendInfo(medInfo) {
    var layer1 = document.querySelectorAll(".wb-mod-t");
    var layer2 = document.querySelectorAll("#nav-1 ul ul");
    var box, candy, btn, chooses;
    var mevent = new Event("input", { bubbles: true });;

    //国药准字
    box = layer1[1].querySelectorAll(".pop-input")[0];
    candy = medInfo.approvalNum;
    btn = document.querySelectorAll("#nav-1 button")[0];
    box.value = candy;
    box.dispatchEvent(mevent);
    btn.click();
    
    setTimeout(() => {
        //规格
        box = layer1[1].querySelectorAll(".pop-select-selected-value")[0];
        chooses = layer2[1].querySelectorAll("li");
        candy = medInfo.specification;
        btn = document.querySelectorAll("#nav-1 button")[1];
        for (var i=0; i<chooses.length; i++) {
            var judgeSpecification = chooses[i].innerHTML.search(new RegExp(candy,"gim"));
            if (judgeSpecification >= 0) {
                box.click();
                chooses[i].click();
                break;
            }
        }
        btn.click();

        //退换货
        box = layer1[1].querySelectorAll(".pop-select-selected-value")[2];
        chooses = layer2[6].querySelectorAll("li");
        box.click();
        chooses[0].click();

        //货号
        box = layer1[2].querySelectorAll(".pop-input")[0];
        candy = medInfo.productNum;
        box.value = candy;
        box.dispatchEvent(mevent);

        //重量体积
        box = layer1[2].querySelectorAll(".pop-input")[2];
        box.value = "0.1";
        box.dispatchEvent(mevent);
        for (var i=3; i<6; i++) {
            box = layer1[2].querySelectorAll(".pop-input")[i];
            box.value = "50";
            box.dispatchEvent(mevent);
        }

        //价格
        candy = medInfo.price;
        chooses = [0, 1, 53];
        for (var i of chooses) {
            box = layer1[5].querySelectorAll("input")[i];
            box.value = candy;
            box.dispatchEvent(mevent);
        }
        box = layer1[5].querySelectorAll(".arrow-down")[0];
        chooses = document.querySelectorAll("[data-attrvalues]");
        chooses[0].click();

        //库存
        candy = medInfo.inventory;
        box = layer1[5].querySelectorAll("input")[54];
        box.value = candy;
        box.dispatchEvent(mevent);
        box = layer1[5].querySelectorAll(".arrow-down")[1];
        chooses = document.querySelectorAll("li[data-attrvalues]");
        chooses[2].click();

        //运费
        var layer3 = document.querySelectorAll("#nav-10 ul ul");

        box = layer1[9].querySelectorAll(".pop-select-selected-value")[0];
        chooses = layer3[1].querySelectorAll("li");
        box.click();
        chooses[0].click();

        box = layer1[9].querySelectorAll(".pop-select-selected-value")[2];
        chooses = layer3[5].querySelectorAll("li");
        box.click();
        chooses[14].click();
        setTimeout(() => {
            box = layer1[9].querySelectorAll(".pop-select-selected-value")[3];
            chooses = layer3[7].querySelectorAll("li");
            box.click();
            chooses[1].click();
        }, 1000);

    }, 500);
}



/*
function setBtnBackgroundColor() {
    chrome.storage.sync.get("color", ({ color }) => {
        getInfo.style.backgroundColor = color;
    });
}

/*
getInfo.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true});
    chrome.scripting.executeScript(
        {
            target: { tabId: tab.id },
            function: getTitle,
        },
        (injectionResults) => {
            for (const frameResult of injectionResults)
                medName.value = frameResult.result.trim();
        }
    );
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: setInfo,
    });
});
*/