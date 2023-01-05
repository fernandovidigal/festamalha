import Swal from 'sweetalert2';
import axios from 'axios';

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
if(deleteBtns){
    deleteBtns.forEach((deleteBtn) => {
        const userId = deleteBtn.dataset.user;
        const row = deleteBtn.closest('tr');
        const username = row.querySelector(
            '.utilizadores_username'
        ).textContent;

        deleteBtn.addEventListener('click', async function (e) {
            e.preventDefault();

            const result = await Swal.fire({
            title: 'Tem a certeza?',
            html:
                'O utilizador <strong>' + username + '</strong> será eliminado!',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sim, eliminar!',
            confirmButtonColor: '#d9534f',
            cancelButtonText: 'Cancelar',
            reverseButtons: true
            });

            if (result.value) {
            try {
                const response = await axios({
                method: 'DELETE',
                url: '/admin/utilizadores/deleteUser',
                data: {
                    id: userId,
                },
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Utilizador eliminado',
                        showConfirmButton: false,
                        timer: 1500,
                        willClose: () => {
                            location.reload();
                        },
                    });
                } else {
                    if (response.status == 204) {
                        Swal.fire({
                        icon: 'error',
                        title:
                            'Deve existir no mínimo um utilizador com privilégios de Administrador',
                        });
                    } else {
                        throw new Error();
                    }
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Não foi possível eliminar o utilizador',
                });
            }
            }
        });
    });
}

function closeAllUserLevelChangers(userLevelChange){
    userLevelChange.forEach(el => {
        el.classList.remove('userLevelChange-open');
    });
}

// LEVEL TOOGLE
const userLevel = document.querySelectorAll('.userLevel');
const userLevelChange = document.querySelectorAll('.userLevelChange');
userLevel.forEach((level, index) => {
    level.addEventListener('click', function(e){
        e.stopPropagation();
        if(!userLevelChange[index].classList.contains('userLevelChange-open')){
            closeAllUserLevelChangers(userLevelChange);
            userLevelChange[index].classList.add('userLevelChange-open');
        } else {
            userLevelChange[index].classList.remove('userLevelChange-open');
        }
    });
});

document.addEventListener('click', function(){
    closeAllUserLevelChangers(userLevelChange);
});