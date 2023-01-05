import Swal from 'sweetalert2';

var msgCloseBtn = document.querySelector('.floatMessage-closeBtn');

if(msgCloseBtn){
    var msgBlock = msgCloseBtn.parentNode;
    let showTimer;

    showTimer = setTimeout(() => {
        msgBlock.remove();
    }, 4000);

    msgCloseBtn.addEventListener('click', function(e){
        e.preventDefault();
        msgBlock.remove();
        showTimer.clearTimeout;
    });
}

const eye = '<svg xmlns="http://www.w3.org/2000/svg" width="21" height="14" class="loginForm__showPassword--btn" viewBox="0 0 21 14"><path d="M10.5,66.917a4.044,4.044,0,0,0-1.139.182,2.02,2.02,0,0,1,.264.984,2.042,2.042,0,0,1-2.042,2.042,2.02,2.02,0,0,1-.984-.264,4.073,4.073,0,1,0,3.9-2.944Zm10.373,3.551A11.694,11.694,0,0,0,10.5,64,11.7,11.7,0,0,0,.127,70.468a1.179,1.179,0,0,0,0,1.064A11.694,11.694,0,0,0,10.5,78a11.7,11.7,0,0,0,10.373-6.468,1.179,1.179,0,0,0,0-1.064ZM10.5,76.25A9.918,9.918,0,0,1,1.826,71,9.917,9.917,0,0,1,10.5,65.75,9.917,9.917,0,0,1,19.175,71,9.917,9.917,0,0,1,10.5,76.25Z" transform="translate(-0.001 -64)"/></svg>';
const eyeSlash = '<svg xmlns="http://www.w3.org/2000/svg" width="23.268" height="18.614" class="loginForm__showPassword--btn" viewBox="0 0 23.268 18.614"><path d="M23.04,17.123,1.3.127A.582.582,0,0,0,.482.218L.118.672a.582.582,0,0,0,.091.818l21.741,17a.582.582,0,0,0,.818-.091l.364-.454a.582.582,0,0,0-.091-.818ZM10.78,5.324l4.9,3.831a4.054,4.054,0,0,0-4.9-3.831Zm1.688,7.964-4.9-3.831a4.062,4.062,0,0,0,4.057,3.921,4.108,4.108,0,0,0,.844-.089Zm-.844-9.218a9.89,9.89,0,0,1,8.65,5.235,10.381,10.381,0,0,1-1.6,2.189l1.372,1.072A12.132,12.132,0,0,0,21.97,9.837a1.176,1.176,0,0,0,0-1.061A11.665,11.665,0,0,0,11.624,2.326a11.224,11.224,0,0,0-3.8.684L9.508,4.329A9.543,9.543,0,0,1,11.624,4.071Zm0,10.47a9.89,9.89,0,0,1-8.65-5.235,10.378,10.378,0,0,1,1.6-2.188L3.2,6.046a12.128,12.128,0,0,0-1.923,2.73,1.176,1.176,0,0,0,0,1.061,11.66,11.66,0,0,0,10.344,6.449,11.268,11.268,0,0,0,3.8-.684l-1.687-1.319A9.561,9.561,0,0,1,11.624,14.542Z" transform="translate(0.01 0.001)"/></svg>';
const passwordField = document.querySelector('.passwordField');
const passwordIconContainer = document.querySelector('.showPassword__icon');

if(passwordIconContainer){
	passwordIconContainer.addEventListener('click', function(){
		if(passwordField.type === 'password'){
			passwordField.type = 'text';
			passwordIconContainer.innerHTML = eyeSlash;
		} else {
			passwordField.type = 'password';
			passwordIconContainer.innerHTML = eye;
		}
	});
}

// USER NAV MENU
const userNavToggle = document.querySelector('.userMenu');
if(userNavToggle) {
	const userMenu = document.querySelector('.user__navigation');
	userNavToggle.addEventListener('click', function(e){
		e.stopPropagation();
		userMenu.classList.toggle('user__navigation-open');
	});

	document.addEventListener('click', function(){
		userMenu.classList.remove('user__navigation-open');
	});
}

const dialogMessage = document.querySelector('.dialogMessage');
if(dialogMessage){
	const type = dialogMessage.dataset.type;
	const text = dialogMessage.dataset.text;
	const selfClose = dialogMessage.dataset.selfclose;

	const dialogParams = {
		icon: type,
		title: text,
		showConfirmButton: selfClose == "true" ? false : true,
	}
	if(selfClose == "true"){
		dialogParams.timer = 1500;
	}
	Swal.fire(dialogParams);
}