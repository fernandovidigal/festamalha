import Swal from 'sweetalert2';
import axios from 'axios';

// Delete Buttons
const deleteBtns = document.querySelectorAll('.btn-delete');
if(deleteBtns){
    deleteBtns.forEach((deleteBtn) => {
      const localidadeId = deleteBtn.dataset.localidade;
      const row = deleteBtn.closest('tr');
      const localidade = row.querySelector('.localidade').textContent;

      deleteBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const result = await Swal.fire({
          title: 'Tem a certeza?',
          html:
            'A localidade: <strong>' + localidade + '</strong> será eliminada!',
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
              url: '/admin/localidades/deleteLocalidade',
              data: {
                id: localidadeId,
              },
            });

            if (response.data.success) {
              Swal.fire({
                icon: 'success',
                title: 'Localidade eliminada',
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
              title: 'Não foi possível eliminar a localidade',
            });
          }
        }
      });
    });
}
