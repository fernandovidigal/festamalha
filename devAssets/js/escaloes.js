import Swal from 'sweetalert2';
import axios from 'axios';

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
if(deleteBtns){
    deleteBtns.forEach((deleteBtn) => {
    const escalaoId = deleteBtn.dataset.escalao;
    const row = deleteBtn.closest('tr');
    const designacao = row.querySelector('.escalao').textContent;
    const sexo = row.querySelector('.sexo').textContent;

    deleteBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const result = await Swal.fire({
        title: 'Tem a certeza?',
        html:
            'O escalão: <strong>' +
            designacao +
            ' (' +
            sexo +
            ')</strong> será eliminado!',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, eliminar!',
        confirmButtonColor: '#d9534f',
        cancelButtonText: 'Cancelar',
        reverseButtons: true,
        });

        if (result.value) {
        try {
            const response = await axios({
            method: 'DELETE',
            url: '/admin/escaloes/deleteEscalao',
            data: {
                id: escalaoId,
            },
            });

            if (response.data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Escalão eliminado',
                showConfirmButton: false,
                timer: 1500,
                willClose: () => {
                location.reload();
                },
            });
            } else {
            throw new Error();
            }
        } catch (err) {
            Swal.fire({
            icon: 'error',
            title: 'Não foi possível eliminar o escalão',
            });
        }
        }
    });
    });
}
