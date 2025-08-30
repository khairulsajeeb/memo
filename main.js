import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js'
    import { getDatabase, ref, push, set, onValue, update, remove } from 'https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js'

    const firebaseConfig = {
      apiKey: "AIzaSyDyeP56JBKGStV6N5-ZfnV9fFhV_iNRsiA",
  authDomain: "class-ccdc2.firebaseapp.com",
  databaseURL: "https://class-ccdc2-default-rtdb.firebaseio.com",
  projectId: "class-ccdc2",
  storageBucket: "class-ccdc2.firebasestorage.app",
  messagingSenderId: "315183429664",
  appId: "1:315183429664:web:5a62d9a831074ea133e445"
    }

    const app = initializeApp(firebaseConfig)
    const db = getDatabase(app)
    const notesRef = ref(db, 'notes')

    const $ = s => document.querySelector(s)
    const notesEl = $('#notes')
    const emptyEl = $('#empty')
    const searchEl = $('#search')
    const filterEl = $('#filter')

    const viewDlg = $('#viewDlg')
    const formDlg = $('#formDlg')
    const noteForm = $('#noteForm')
    const formTitle = $('#formTitle')

    const inputTitle = $('#title')
    const inputDate = $('#date')
    const inputDesc = $('#desc')

    const vTitle = $('#vTitle')
    const vDate = $('#vDate')
    const vDesc = $('#vDesc')

    const addBtn = $('#addBtn')
    const editBtn = $('#editBtn')
    const delBtn = $('#delBtn')

    let currentId = null
    let allNotes = []

    inputDate.valueAsDate = new Date()

    function openDlg(dlg){ dlg.showModal() }
    function closeDlg(dlg){ dlg.close() }
    document.querySelectorAll('[data-x]').forEach(b=>b.addEventListener('click', e=>{
      const dlg = e.target.closest('dialog')
      if(dlg) closeDlg(dlg)
    }))

    onValue(notesRef, (snap)=>{
      const val = snap.val() || {}
      allNotes = Object.entries(val).map(([id, n])=>({ id, ...n }))
        .sort((a,b)=> (b.createdAt||0) - (a.createdAt||0))
      applyFilters()
    })

    function applyFilters(){
      const q = searchEl.value.toLowerCase()
      const f = filterEl.value
      const now = new Date()
      let filtered = allNotes
      if(q){
        filtered = filtered.filter(n => (n.title||'').toLowerCase().includes(q) || (n.description||'').toLowerCase().includes(q))
      }
      if(f==="today"){
        filtered = filtered.filter(n=> sameDay(new Date(n.date), now))
      } else if(f==="week"){
        filtered = filtered.filter(n=> sameWeek(new Date(n.date), now))
      }
      renderList(filtered)
    }

    searchEl.addEventListener('input', applyFilters)
    filterEl.addEventListener('change', applyFilters)

    function renderList(items){
      notesEl.innerHTML = ''
      if(!items.length){ emptyEl.hidden = false; return }
      emptyEl.hidden = true
      for(const n of items){
        const li = document.createElement('div')
        li.className = 'note'
        li.innerHTML = `
          <div>
            <div class="title">${escapeHtml(n.title||'Untitled')}</div>
            <div class="sub">${fmtDate(n.date)}</div>
          </div>
          <div class="sub">${new Date(n.createdAt||0).toLocaleTimeString()}</div>
        `
        li.addEventListener('click', ()=> openView(n))
        notesEl.appendChild(li)
      }
    }

    function openView(n){
      currentId = n.id
      vTitle.textContent = n.title || 'Untitled'
      vDate.textContent = fmtDate(n.date)
      vDesc.textContent = n.description || ''
      openDlg(viewDlg)
    }

    addBtn.addEventListener('click', ()=>{
      formTitle.textContent = 'Add note'
      currentId = null
      noteForm.reset()
      inputDate.valueAsDate = new Date()
      openDlg(formDlg)
    })

    editBtn.addEventListener('click', async ()=>{
      if(!currentId) return
      formTitle.textContent = 'Edit note'
      inputTitle.value = vTitle.textContent
      inputDate.value = dateToInput(vDate.textContent)
      inputDesc.value = vDesc.textContent
      openDlg(formDlg)
    })

    delBtn.addEventListener('click', async ()=>{
      if(!currentId) return
      const go = confirm('Delete this note?')
      if(!go) return
      await remove(ref(db, `notes/${currentId}`))
      currentId = null
      closeDlg(viewDlg)
    })

    noteForm.addEventListener('submit', async (e)=>{
      e.preventDefault()
      const title = inputTitle.value.trim()
      const date = inputDate.value
      const description = inputDesc.value.trim()
      if(!title || !date){ alert('Title and date are required'); return }

      if(currentId){
        await update(ref(db, `notes/${currentId}`), { title, date, description })
      } else {
        const node = push(notesRef)
        await set(node, { title, date, description, createdAt: Date.now() })
      }
      closeDlg(formDlg)
      closeDlg(viewDlg)
      currentId = null
    })

    function fmtDate(s){
      if(!s) return ''
      const d = new Date(s)
      if(Number.isNaN(d.getTime())) return s
      return d.toLocaleDateString()
    }
    function dateToInput(label){
      const d = new Date(label)
      if(!Number.isNaN(d)){
        const m = String(d.getMonth()+1).padStart(2,'0')
        const day = String(d.getDate()).padStart(2,'0')
        return `${d.getFullYear()}-${m}-${day}`
      }
      return ''
    }
    function escapeHtml(str){
      return String(str).replace(/[&<>\"]/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s]))
    }
    function sameDay(d1,d2){
      return d1.getFullYear()===d2.getFullYear() && d1.getMonth()===d2.getMonth() && d1.getDate()===d2.getDate()
    }
    function sameWeek(d1,d2){
      const oneJan = new Date(d1.getFullYear(),0,1)
      const week1 = Math.floor(((d1 - oneJan) / 86400000 + oneJan.getDay()+1)/7)
      const week2 = Math.floor(((d2 - new Date(d2.getFullYear(),0,1)) / 86400000 + d2.getDay()+1)/7)
      return d1.getFullYear()===d2.getFullYear() && week1===week2
    }