# h5-preview-image

手机端基于jQuery|Zepto的图片预览插件，源自(amazeui)[https://github.com/amazeui/amazeui/blob/master/js/ui.pureview.js]的图片预览

## 用法
就是jQuery|Zepto插件的用法了

	$(selector).preview({
		shareBtn: false, //默认值true
        showDirection: false, //是否显示左右翻页箭头；默认值false
        target: 'img', //预览的图片路径，a标签的href或者是img标签的src属性；默认值img
        weChatImagePreview: true //是否微信浏览器中调用微信自带的；默认值true
	});

## Demo
手机上打开|浏览器模拟器方式查看

[demo](http://115.28.223.2:9999/h5-preview-image "demo")