let getimg = document.getElementById("getimg");
let sendinfo = document.getElementById("sendinfo");
let getfromweb = document.getElementById("getfromweb");
let sendfromweb = document.getElementById("sendfromweb");

let num = document.getElementById("num");
let spec = document.getElementById("spec");
let enterprise = document.getElementById("enterprise");


/* 
    --------
    提取京东主图
    --------
*/
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


/* 
    --------
    上传药品信息
    --------
*/
sendinfo.addEventListener("click", async () => {
    //读取填写的信息
    var medInfo = getInfo();
    enterprise.value = medInfo.enterprise;
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
            var medInfo = {
                "approvalNum": jsonArr[i].approvalNum,
                "specification": jsonArr[i].specification,
                "productNum": jsonArr[i].productNum,
                "price": jsonArr[i].price,
                "inventory": jsonArr[i].inventory,
                "enterprise": jsonArr[i].enterprise
            };
            return medInfo;
        }
}

function sendInfo(medInfo) {
    var layer1 = document.querySelectorAll(".wb-mod-t");
    var layer2 = document.querySelectorAll("#nav-1 ul ul");
    var box, candy, btn, chooses;
    var title;
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

        /*
        //商家sku
        candy = medInfo.productNum;
        box = layer1[5].querySelectorAll("input")[58];
        box.value = candy;
        box.click();
        */

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
    --------
    保存网页信息
    --------
*/
getfromweb.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true});
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: getFromWeb,
    });
});

function getFromWeb() {
    chrome.storage.sync.clear();
    var keys = document.querySelectorAll("dl.clearfix dt");
    medInfo = {};
    medInfo["品牌："] = document.querySelectorAll("#parameter-brand a")[0].innerHTML;
    for (var i=0; i<keys.length; i++) {
        value = document.querySelectorAll("dl.clearfix dd")[i];
        medInfo[keys[i].innerHTML + '：'] = value.innerHTML;
    }
    chrome.storage.sync.set(medInfo);
}


/* 
    --------
    上传网页信息
    --------
*/
sendfromweb.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true});
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: sendFromWeb,
    });
});

function sendFromWeb() {
    var layer1 = document.querySelectorAll(".wb-mod-t");
    var layer2 = layer1[3].querySelectorAll("div.clearfix");
    var labels, box , chooses, brand;
    var mevent = new Event("input", { bubbles: true });

    //上传药品详细信息
    labels = layer2[2].querySelectorAll("label");
    chrome.storage.sync.get((medInfo) => {
        for (var i=0; i<labels.length; i++) {
            var label = labels[i];
            var reg1 = label.innerHTML == "药品分类：";
            var reg2 = label.innerHTML == "药品类型：";
            var reg3 = label.innerHTML == "剂型：";
            var reg4 = label.innerHTML == "适用人群：";
            if (medInfo.hasOwnProperty(label.innerHTML)) {
                //如果是直接填写
                if (!(reg1 || reg2 || reg3 || reg4)) {
                    box = label.parentNode.querySelectorAll("input")[0];
                    if (box.value == "") {
                        box.value = medInfo[label.innerHTML];
                        box.dispatchEvent(mevent);
                    }
                //如果是药品分类
                } else if (reg1) {
                    box = label.parentNode.querySelectorAll("input")[0];
                    box.click();
                    chooses = label.parentNode.querySelectorAll("li");
                    for (var j=0; j<chooses.length; j++)
                        if (chooses[j].innerHTML == medInfo[label.innerHTML])
                            chooses[j].click();
                //如果是药品类型
                } else if (reg2) {
                    box = label.parentNode.querySelectorAll("span")[0];
                    box.click();
                    chooses = label.parentNode.querySelectorAll("li");
                    for (var j=0; j<chooses.length; j++)
                        if (chooses[j].innerHTML == medInfo[label.innerHTML])
                            chooses[j].click();
                //如果是剂型
                } else if (reg3) {
                    box = label.parentNode.querySelectorAll("input")[0];
                    box.click();
                    chooses = label.parentNode.querySelectorAll("li");
                    for (var j=0; j<chooses.length; j++)
                        if (chooses[j].innerHTML == medInfo[label.innerHTML])
                            chooses[j].click();
                }  
            }
        }
    });
    //更改标题
    chrome.storage.sync.get((medInfo) => {
        box = layer1[1].querySelectorAll("input")[1];
        title = box.value;
        title = medInfo["品牌："] + " " + title + " " + medInfo["适用症/功能主治："];
        title = title.replace(/[，。、]/g, "");
        box.value = title;
        box.dispatchEvent(mevent);
    });
    //上传品牌
    chrome.storage.sync.get("品牌：", (medInfo) => {
        console.log(medInfo["品牌："]);
        brand = medInfo["品牌："];
        box = layer1[1].querySelectorAll("span.pop-select-placeholder")[1];
        box.click();
    });
    setTimeout(() => {
        box = document.querySelectorAll(".radio-search__input")[0];
        box.value = brand;
        box.dispatchEvent(mevent);
        document.querySelectorAll(".radio-search__button")[0].click();
        setTimeout(() => {
            chooses = document.querySelectorAll(".pop-radio-input");
            chooses[0].click();
            document.querySelectorAll(".radio-search__operation")[0].click();
        }, 1000);
    }, 500);
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