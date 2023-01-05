import Swal from 'sweetalert2';
import axios from 'axios';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { docDefinition, makeHeader, makeFolhaParciais, makeFooter } from './printFunctions';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

let guardaResultados = document.getElementsByName('guardaResultados');

if (guardaResultados) {
    guardaResultados.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            handleParciais(btn, "/torneio/registaParciais", true);
        });
    });
}

function validaParesDeParciais(parcialEquipa1, parcialEquipa2) {
    const equipaParcial1Value = parseInt(parcialEquipa1.value.trim());
    const equipaParcial2Value = parseInt(parcialEquipa2.value.trim());
    var patt = new RegExp("^[0-9]{1,2}$");
    let valido = true;

    if (parcialEquipa1.value != null && parcialEquipa1.value.length > 0) {
        if (!patt.test(parcialEquipa1.value)) {
            parcialEquipa1.classList.add('parcial_error');
            valido = false;
        } else {
            if (equipaParcial1Value % 3 != 0 || equipaParcial1Value < 0 || equipaParcial1Value > 30) {
                parcialEquipa1.classList.add('parcial_error');
                valido = false;
            }
        }
    } else {
        valido = false;
    }

    if (parcialEquipa2.value != null && parcialEquipa2.value.length > 0) {
        if (!patt.test(parcialEquipa2.value)) {
            parcialEquipa2.classList.add('parcial_error');
            valido = false;
        } else {
            if (
                equipaParcial2Value % 3 != 0 ||
                equipaParcial2Value < 0 ||
                equipaParcial2Value > 30
            ) {
                parcialEquipa2.classList.add('parcial_error');
                valido = false;
            }
        }
    } else {
        valido = false;
    }

    if (parcialEquipa1.value != null && parcialEquipa1.value.length > 0 && parcialEquipa2.value != null && parcialEquipa2.value.length > 0) {
        if (equipaParcial1Value == equipaParcial2Value || (equipaParcial1Value != 30 && equipaParcial2Value != 30)) {
            parcialEquipa1.classList.add('parcial_error');
            parcialEquipa2.classList.add('parcial_error');
            valido = false;
        }
    }

    return valido;
}

function verificaVencedor(parcialEquipa1Value, parcialEquipa2Value) {
    if (parcialEquipa1Value > parcialEquipa2Value && parcialEquipa1Value == 30) {
        return 1;
    } else if (parcialEquipa1Value < parcialEquipa2Value && parcialEquipa2Value == 30) {
        return 2;
    } else {
        return -1;
    }
}

const equipaParciais = document.querySelectorAll('.jogoInfo');
if (equipaParciais) {
    equipaParciais.forEach(parciais => {
        const parciaisInput = parciais.querySelectorAll('.parcial');
        parciaisInput.forEach((parcial, index) => {
            parcial.addEventListener('keydown', function (e) {
                if (e.keyCode == 9) {
                    let idx = index;
                    if (idx == 5) {
                        idx = 0;
                    } else {
                        idx++;
                    }
                    parciaisInput[idx].focus();
                    e.preventDefault();
                }
            });

            parcial.addEventListener('input', function () {
                const parcial1 = validaParesDeParciais(parciaisInput[0], parciaisInput[1]);
                const parcial2 = validaParesDeParciais(parciaisInput[2], parciaisInput[3]);
                const parcial3 = validaParesDeParciais(parciaisInput[4], parciaisInput[5]);

                if (parcial1) {
                    parciaisInput[0].classList.remove('parcial_error');
                    parciaisInput[1].classList.remove('parcial_error');
                }

                if (parcial2) {
                    parciaisInput[2].classList.remove('parcial_error');
                    parciaisInput[3].classList.remove('parcial_error');
                }

                if (parcial3) {
                    parciaisInput[4].classList.remove('parcial_error');
                    parciaisInput[5].classList.remove('parcial_error');
                }

                // Desactiva os inputs para o parcial 3 se já houver dois jogos ganhos pela mesma equipa
                if (parcial1 && parcial2) {
                    const vencedorParcial1 = verificaVencedor(parseInt(parciaisInput[0].value), parseInt(parciaisInput[1].value));
                    const vencedorParcial2 = verificaVencedor(parseInt(parciaisInput[2].value), parseInt(parciaisInput[3].value));

                    if (vencedorParcial1 == vencedorParcial2 && vencedorParcial1 != -1 && vencedorParcial2 != -1) {
                        parciaisInput[4].value = '';
                        parciaisInput[4].disabled = true;
                        parciaisInput[5].value = '';
                        parciaisInput[5].disabled = true;
                        parciaisInput[4].classList.remove('parcial_error');
                        parciaisInput[5].classList.remove('parcial_error');
                    } else {
                        parciaisInput[4].disabled = false;
                        parciaisInput[5].disabled = false;
                    }
                }
            });
        });
    });
}


function getEquipasInputValues(jogosInfoRow) {
    return {
        equipa1: {
            parcial1: jogosInfoRow.querySelector('.equipa1_parcial1'),
            parcial2: jogosInfoRow.querySelector('.equipa1_parcial2'),
            parcial3: jogosInfoRow.querySelector('.equipa1_parcial3')
        },
        equipa2: {
            parcial1: jogosInfoRow.querySelector('.equipa2_parcial1'),
            parcial2: jogosInfoRow.querySelector('.equipa2_parcial2'),
            parcial3: jogosInfoRow.querySelector('.equipa2_parcial3')
        }
    }
}

function validaPontosEquipas(equipa1, equipa2) {
    // Valida Parcial 1
    const parcial1 = validaParesDeParciais(equipa1.parcial1, equipa2.parcial1);
    if (!parcial1) {
        Swal.fire({
            icon: 'error',
            title: 'Parciais do primeiro jogo inválidos'
        });
        return false;
    }

    // Valida Parcial 2
    const parcial2 = validaParesDeParciais(equipa1.parcial2, equipa2.parcial2);
    if (!parcial2) {
        Swal.fire({
            icon: 'error',
            title: 'Parciais do segundo jogo inválidos'
        });
        return false;
    }

    if (parcial1 && parcial2) {
        const vencedorParcial1 = verificaVencedor(parseInt(equipa1.parcial1.value), parseInt(equipa2.parcial1.value));
        const vencedorParcial2 = verificaVencedor(parseInt(equipa1.parcial2.value), parseInt(equipa2.parcial2.value));

        if (vencedorParcial1 != vencedorParcial2) {
            const parcial3 = validaParesDeParciais(equipa1.parcial3, equipa2.parcial3);
            if (!parcial3) {
                Swal.fire({
                    icon: 'error',
                    title: 'Parciais do terceiro jogo inválidos',
                });
                return false;
            }
        }
    }

    return true;
}

async function handleParciais(btn, url, moveToEnd, actualizar = 0) {
    const jogosInfoRow = btn.closest('.jogoInfo');
    const jogoID = btn.dataset.jogoid;

    const equipasInputValues = getEquipasInputValues(jogosInfoRow);
    const valido = validaPontosEquipas(equipasInputValues.equipa1, equipasInputValues.equipa2);

    if (valido) {
        // Cria o componente de carregamento loading
        const loadingDiv = createLoading();
        const currentBtnWrapper = btn.closest('.btn_wrapper');
        // Substitui o botão pelo componente de carregamento
        currentBtnWrapper.replaceChild(loadingDiv, btn);

        try {
            const response = await axios({
                method: 'POST',
                url: url,
                data: {
                    jogoId: jogoID,
                    parciaisData: {
                        equipa1: {
                            parcial1: equipasInputValues.equipa1.parcial1.value,
                            parcial2: equipasInputValues.equipa1.parcial2.value,
                            parcial3: equipasInputValues.equipa1.parcial3.value
                        },
                        equipa2: {
                            parcial1: equipasInputValues.equipa2.parcial1.value,
                            parcial2: equipasInputValues.equipa2.parcial2.value,
                            parcial3: equipasInputValues.equipa2.parcial3.value
                        }
                    }
                }
            });
            const data = response.data;

            if (data.success) {
                // Mostra as pontuações
                jogosInfoRow.querySelector('.equipa1_pontos').textContent = data.equipa1_pontos;
                jogosInfoRow.querySelector('.equipa2_pontos').textContent = data.equipa2_pontos;

                if (moveToEnd) {
                    const parent = jogosInfoRow.closest('tbody');
                    parent.removeChild(jogosInfoRow);
                    parent.appendChild(jogosInfoRow);
                }

                const parciaisInput = jogosInfoRow.querySelectorAll(".parcial");
                parciaisInput.forEach(parcial => {
                    parcial.disabled = true;
                });

                // Cria o botão EDITAR
                const editBtn = createEditButton(jogoID);
                removeAllChilds(currentBtnWrapper);
                currentBtnWrapper.appendChild(editBtn);

                Swal.fire({
                    icon: 'success',
                    title: `Parciais ${(actualizar == 0) ? 'adicionados' : 'actualizados'}`,
                    showConfirmButton: false,
                    timer: 1000
                });

            } else {
                throw new Error((actualizar == 0) ? 'Não foi possível adicionar os parciais' : 'Não foi possível actualizar os parciais');
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: err.message,
            });
            currentBtnWrapper.replaceChild(btn, loadingDiv);
        }
    }
}

function createLoading() {
    const loadingDiv = document.createElement("DIV");
    loadingDiv.classList.add("loading");

    const bounce1Div = document.createElement("DIV");
    bounce1Div.classList.add("bounce1");
    const bounce2Div = document.createElement("DIV");
    bounce2Div.classList.add("bounce2");
    const bounce3Div = document.createElement("DIV");
    bounce3Div.classList.add("bounce3");

    loadingDiv.appendChild(bounce1Div);
    loadingDiv.appendChild(bounce2Div);
    loadingDiv.appendChild(bounce3Div);

    return loadingDiv;
}

function createEditButton(jogoId) {
    const editButton = document.createElement("A");
    editButton.classList.add("btn", "btn-tertiary", "btn__edit-resultados");
    editButton.setAttribute("name", "editarResultados");
    editButton.dataset.jogoid = jogoId;
    editButton.textContent = "Editar";

    return editButton;
}

function createUdpateButton(jogoId) {
    const deleteButton = document.createElement("A");
    deleteButton.classList.add("btn", "btn-secondary", "btn__update-resultados");
    deleteButton.setAttribute("name", "updateResultados");
    deleteButton.dataset.jogoid = jogoId;
    deleteButton.textContent = "Actualizar";

    return deleteButton;
}

const editResultadosBtns = document.querySelectorAll('.btn_wrapper');
if (editResultadosBtns) {
    editResultadosBtns.forEach((btn, index) => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const editBtn = e.target;
            const jogoId = editBtn.dataset.jogoid;

            if (editBtn.tagName == 'A' && editBtn.getAttribute('name') == "editarResultados") {
                const jogoInfoRow = this.parentNode;
                activaEdicaoResultados(jogoInfoRow);
                removeAllChilds(this);
                removeAllChilds(jogoInfoRow.querySelector('.equipa1_pontos'));
                removeAllChilds(jogoInfoRow.querySelector('.equipa2_pontos'));
                this.appendChild(createUdpateButton(jogoId));
            } else if (editBtn.tagName == 'A' && editBtn.getAttribute('name') == "updateResultados") {
                handleParciais(editBtn, "/torneio/actualizaParciais", false, 1);
            }
        });
    });
}

function activaEdicaoResultados(element) {
    const equipaParcial = element.querySelectorAll('.parcial');

    equipaParcial.forEach((parcial, index) => {
        parcial.disabled = false;
    });
}

function removeAllChilds(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

async function imprimeFichaParciais(escalao, fase, campo) {
    try {
        const response = await axios(`/torneio/fichaParciais/${escalao}/${fase}/${campo}`);
        const data = response.data;

        docDefinition.content = [];

        if (data.success) {
            makeHeader(docDefinition, data.torneio);

            docDefinition.content.push({
                text: `Resultados dos parciais - ${(fase != 100) ? fase + 'ª Fase' : 'Fase Final'}`,
                alignment: 'center',
                bold: true,
                fontSize: 16
            });

            data.listaCampos.forEach((campo, index) => {
                if (index > 0 && campo.listaJogos.length > 7) {
                    docDefinition.content.push({
                        text: "PageBreak",
                        fontSize: 0,
                        color: "#ffffff",
                        margin: [0, 0, 0, 0],
                        pageBreak: "before"
                    });
                }
                makeFolhaParciais(docDefinition, fase, campo, data.listaEquipas, data.listaParciais);
            });
            makeFooter(docDefinition, `Resultados dos parciais - ${(fase != 100) ? fase + 'ª Fase' : 'Fase Final'}`);
            pdfMake.createPdf(docDefinition).print();
        } else {
            Swal.fire({
                icon: 'error',
                title: data.errMsg,
            });
        }
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: 'Não foi possível obter os dados!',
        });
    }
}

const printBtn = document.querySelector('.btn-print');
if (printBtn) {
    printBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const path = window.location.pathname;
        const pathComponents = path.split('/');

        let escalaoIndex = pathComponents.indexOf('escalao');
        let faseIndex = pathComponents.indexOf('fase');
        let campoIndex = pathComponents.indexOf('campo');

        escalaoIndex = (escalaoIndex != -1) ? pathComponents[escalaoIndex + 1] : 0;
        faseIndex = (faseIndex != -1) ? pathComponents[faseIndex + 1] : 0;
        campoIndex = (campoIndex != -1) ? pathComponents[campoIndex + 1] : 0;

        imprimeFichaParciais(escalaoIndex, faseIndex, campoIndex);
    });
}

// NOVO
function removeAllSelectedClasses(campos, allCampos) {
    campos.forEach(campo => campo.classList.remove('customSelect__campos-link-selected'));
    allCampos.classList.remove('customSelect__campos-link-selected');
}

function removeAllSelectedFases(fases) {
    fases.forEach(fase => fase.classList.remove('customSelect__links-selected'));
}

function showLoading(element) {
    const loadingDiv = document.createElement('div');
    loadingDiv.classList.add('loading', 'campos__loading');
    const bounce1 = document.createElement('div');
    bounce1.classList.add('bounce1');
    const bounce2 = document.createElement('div');
    bounce2.classList.add('bounce2');
    const bounce3 = document.createElement('div');
    bounce3.classList.add('bounce3');

    loadingDiv.appendChild(bounce1);
    loadingDiv.appendChild(bounce2);
    loadingDiv.appendChild(bounce3);

    element.appendChild(loadingDiv);
}

function geraCamposLink(tableElement, listaCampos) {
    // Limpa todos os elementos da tabela
    removeAllChilds(tableElement);

    // Gera todos os campos
    while (listaCampos.length > 0) {
        const camposRowItem = listaCampos.splice(0, 5);
        const row = document.createElement('tr');
        camposRowItem.forEach(campo => {
            const cell = document.createElement('td');
            const campoLink = document.createElement('a');
            campoLink.classList.add('customSelect__campos-link', 'customSelect__links-campos');
            if (campo.completo) {
                campoLink.classList.add('customSelect__campos-link-completed');
            }
            campoLink.dataset.campo = campo.campo;
            campoLink.textContent = (campo.fase != 100) ? campo.campo : campo.designacao;

            cell.appendChild(campoLink);
            row.appendChild(cell);
        });
        tableElement.appendChild(row);
    }
}

function createVerRegistarParciaisBtn(element, escalaoId, label) {
    const link = document.createElement('a');
    link.classList.add("btn", "btn-secondary", "btn-smaller", "btn-verRegistaParciais");
    link.setAttribute("href", `/torneio/resultados/escalao/${escalaoId}`);
    link.textContent = label;
    element.appendChild(link);
}

function createProcessarProximaFaseBtn(element, escalaoId) {
    const link = document.createElement('a');
    link.classList.add("btn", "btn-secondary", "btn-smaller");
    link.setAttribute("href", `/torneio/processaProximaFase/escalao/${escalaoId}`);
    link.textContent = 'Processa Próxima Fase';
    element.appendChild(link);
}

const competicaoSelectBoxes = document.querySelectorAll('.escalao__item');
if (competicaoSelectBoxes) {
    competicaoSelectBoxes.forEach(escalaoBox => {
        const fasesSelect = escalaoBox.querySelector('.customSelect__fases');
        const camposSelect = escalaoBox.querySelector('.customSelect_campos');
        const actionBtns = escalaoBox.querySelector('.escalao__item-actionBtnBar');
        const escalaoId = escalaoBox.dataset.escalao;
        const escalaoCompleto = (escalaoBox.dataset.completo === 'true') ? true : false;
        const faseActualTorneio = escalaoBox.dataset.fase;
        const vencedor = (escalaoBox.dataset.vencedor === 'true') ? true : false;

        escalaoBox.addEventListener('click', async function (e) {

            const faseActual = fasesSelect.querySelector('.fasesInput').value;
            const camposHeader = camposSelect.querySelector('.customSelect__camposHeader');

            // Seleciona a Fase
            if (e.target.classList.contains('customSelect__links-fases') && faseActual != e.target.dataset.fase) {
                // Remove todos os elementos do header da selectBox
                removeAllChilds(camposHeader);
                // Adiciona o loading
                showLoading(camposHeader);

                // Fetch campos da Base de Dados
                const response = await axios(`/torneio/getAllCamposPorFase/${escalaoId}/${e.target.dataset.fase}`);
                const data = response.data;

                if (data.success) {
                    // Cria os os campos
                    const tableElement = escalaoBox.querySelector('.customSelect__campos__table tbody');
                    geraCamposLink(tableElement, data.listaCampos);
                    camposHeader.textContent = 'Todos os Campos';
                    const allCampos = camposSelect.querySelector('.customSelect__campos-all-link');
                    allCampos.classList.add('customSelect__campos-link-selected');
                    // Altera a SelectBox da Fase em conformidade com o selecionado
                    const faseSelecionada = e.target.dataset.fase;
                    const fasesInput = fasesSelect.querySelector('.fasesInput');
                    const fasesHeader = fasesSelect.querySelector('.customSelect__fasesHeader');
                    const faseSelectLinks = fasesSelect.querySelectorAll('.customSelect__links-fases');
                    fasesInput.value = faseSelecionada;
                    fasesHeader.textContent = (parseInt(faseSelecionada) != 100) ? faseSelecionada + 'ª Fase' : 'Fase Final';
                    removeAllSelectedFases(faseSelectLinks);
                    e.target.classList.add('customSelect__links-selected');

                    // Altera o action button
                    const mainActionBtnPlaceholder = actionBtns.querySelector('.escalao__item-actionBtnBar-mainAction');
                    if (parseInt(faseSelecionada) < parseInt(faseActualTorneio)) {
                        mainActionBtnPlaceholder.querySelector('.btn-verRegistaParciais').textContent = 'Ver Parciais';
                    } else {
                        if (escalaoCompleto) {
                            removeAllChilds(mainActionBtnPlaceholder);
                            createProcessarProximaFaseBtn(mainActionBtnPlaceholder, escalaoId);
                        } else {
                            // Verifica se o botão registar paraciais ou ver parciais já existe
                            const verRegistarParciaisBtn = mainActionBtnPlaceholder.querySelector('.btn-verRegistaParciais');
                            if (verRegistarParciaisBtn) {
                                mainActionBtnPlaceholder.querySelector('.btn-verRegistaParciais').textContent = 'Registar Parciais';
                            } else {
                                removeAllChilds(mainActionBtnPlaceholder);
                                createVerRegistarParciaisBtn(mainActionBtnPlaceholder, escalaoId, 'Registar Parciais');
                            }
                        }
                    }
                }
            }
        });

        if (actionBtns) {
            actionBtns.addEventListener('click', function (e) {
                e.stopPropagation();
                if (e.target.classList.contains('btn-verRegistaParciais') || e.target.classList.contains('editarParciais__btn')) {
                    let url = e.target.getAttribute("href");
                    let fase = 0;
                    let campo = 0;
                    if (!vencedor) {
                        fase = escalaoBox.querySelector('.fasesInput').value;
                        campo = escalaoBox.querySelector('.camposInput').value;
                    } else {
                        fase = faseActualTorneio;
                    }

                    //url = url + `/fase/${fase}/campo/${campo}`;
                    //e.target.setAttribute("href", url);
                    e.preventDefault();
                    window.location.assign(url + `/fase/${fase}/campo/${campo}`)
                }
            });
        }
    });
}

const camposSelectList = document.querySelectorAll('.customSelect_campos');
if (camposSelectList) {
    camposSelectList.forEach(campoSelect => {
        campoSelect.addEventListener('click', function (e) {
            if (e.target.classList.contains('customSelect__links-campos')) {
                const camposInput = campoSelect.querySelector('.camposInput');
                const camposHeader = campoSelect.querySelector('.customSelect__camposHeader');
                const campoSelectLinks = campoSelect.querySelectorAll('.customSelect__links-campos');
                const campoSelecionado = e.target.dataset.campo;
                const allCampos = campoSelect.querySelector('.customSelect__campos-all-link');
                camposInput.value = campoSelecionado;
                camposHeader.textContent = 'Campo ' + campoSelecionado;
                removeAllSelectedClasses(campoSelectLinks, allCampos);
                e.target.classList.add('customSelect__campos-link-selected');
            } else if (e.target.classList.contains('customSelect__campos-all-link')) {
                const camposInput = campoSelect.querySelector('.camposInput');
                const campoSelectLinks = campoSelect.querySelectorAll('.customSelect__links-campos');
                const camposHeader = campoSelect.querySelector('.customSelect__camposHeader');
                camposInput.value = 0;
                camposHeader.textContent = 'Todos os Campos';
                removeAllSelectedClasses(campoSelectLinks, e.target);
                e.target.classList.add('customSelect__campos-link-selected');
            }
        });
    });
}

// TAB CONTROLLER
function closeAllTabs(tabItems, tabContainers) {
    tabItems.forEach((item, index) => {
        item.classList.remove('tabbedMenu__item-selected');
        tabContainers[index].classList.remove('tabbedContainer-open');
    });
}

const tabItems = document.querySelectorAll('.tabbedMenu__item');
const tabContainers = document.querySelectorAll('.tabbedContainer');
if (tabItems && tabContainers) {
    tabItems.forEach((item, index) => {
        item.addEventListener('click', function () {
            closeAllTabs(tabItems, tabContainers);
            item.classList.add('tabbedMenu__item-selected');
            tabContainers[index].classList.add('tabbedContainer-open');
        });
    });
}

// PROCESSAR PROXIMA FASE MENU TRIGGER
const competicaoOptions = document.querySelector('.competicaoOptions');
if (competicaoOptions) {
    const competicaoOptionsMenu = competicaoOptions.querySelector('.competicaoOptions-menu');
    const competicaoOptionsTrigger = competicaoOptions.querySelector('.competicaoOptions-trigger');

    competicaoOptions.addEventListener('click', function (e) {
        competicaoOptionsMenu.classList.toggle('competicaoOptions-menu-show');
        competicaoOptionsTrigger.classList.toggle('competicaoOptions-trigger-open');
    });

    // Fecha o menu quando se clica fora
    document.addEventListener('click', function () {
        if (competicaoOptionsMenu.classList.contains('competicaoOptions-menu-show')) {
            competicaoOptionsMenu.classList.remove('competicaoOptions-menu-show');
            competicaoOptionsTrigger.classList.remove('competicaoOptions-trigger-open');
        }
    });
}