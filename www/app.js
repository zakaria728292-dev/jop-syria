// طلب إذن الإشعارات واستثناء البطارية للعمل في الخلفية بأمان
async function initAppPermissions() {
  if (window.Capacitor && window.Capacitor.Plugins) {
    // 1. طلب إذن الإشعارات المحلية الآمن لأندرويد
    try {
      if (window.Capacitor.Plugins.LocalNotifications) {
        let permStatus = await window.Capacitor.Plugins.LocalNotifications.checkPermissions();
        if (permStatus.display === 'prompt' || permStatus.display === 'prompt-with-rationale') {
          await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
        }
      }
    } catch (e) {
      console.log('Notification permission request error:', e);
    }
  }
}

// تشغيل الوظائف فور فتح التطبيق
document.addEventListener('DOMContentLoaded', initAppPermissions);

// طلب السماحيات الذكي عند فتح التطبيق
async function requestAppPermissionsOnFirstLaunch() {
    const hasPrompted = localStorage.getItem('app_permissions_requested_v1');
    if (!hasPrompted) {
        try {
            if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
                await window.Capacitor.Plugins.LocalNotifications.requestPermissions();
            } else if ('Notification' in window && Notification.permission !== 'granted') {
                await Notification.requestPermission();
            }
        } catch (e) {
            console.log("Permission error:", e);
        }
        localStorage.setItem('app_permissions_requested_v1', 'true');
    }
}

const bannedWords = ["كلب", "سني", "صنة", "ندل", "حيوان", "علوي", "ابو بكر", "بكر", "بكري", "شرموط", "شرموطة", "عاهرة"];
function checkProfanity(text) {
    const lowerText = text.toLowerCase();
    for (let word of bannedWords) {
        if (lowerText.includes(word)) { return true; }
    }
    return false;
}

async function triggerNotification(title, body, imageUrl = null) {
    if (document.hidden || currentActivePage !== 'support') {
        // إذا كان التطبيق يعمل عبر Capacitor في أندرويد
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
            try {
                await window.Capacitor.Plugins.LocalNotifications.schedule({
                    notifications: [
                        {
                            title: title,
                            body: body,
                            id: new Date().getTime() % 100000,
                            schedule: { at: new Date(Date.now() + 100) },
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
            } catch (e) {
                console.log("LocalNotification Error:", e);
            }
        } 
        // إذا كان التطبيق يعرض في المتصفح العادي
        else if ("Notification" in window && Notification.permission === "granted") {
            const notificationOptions = {
                body: body,
                icon: "https://i.ibb.co/23cTDk18/1782795963942.png",
                badge: "https://i.ibb.co/23cTDk18/1782795963942.png",
                image: imageUrl ? imageUrl : undefined
            };
            try { new Notification(title, notificationOptions); } catch (e) {}
        }
    }
}

function linkify(text) {
    if (!text) return '';
    const urlPattern = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    const wwwPattern = /(^|[^\/])(www\.[\S]+(\b|$))/g;
    
    let html = text;
    html = html.replace(urlPattern, function(match) {
        return `<a href="${match}" target="_blank" rel="noopener noreferrer" class="chat-link" onclick="event.stopPropagation();">${match}</a>`;
    });
    html = html.replace(wwwPattern, function(match, p1, p2) {
        return `${p1}<a href="http://${p2}" target="_blank" rel="noopener noreferrer" class="chat-link" onclick="event.stopPropagation();">${p2}</a>`;
    });
    return html;
}

function attachLongPressListener(element, textToCopy) {
    let pressTimer;
    const startPress = (e) => {
        if (e.type === "click" || (e.touches && e.touches.length > 1)) return;
        pressTimer = setTimeout(() => {
            if (navigator.vibrate) navigator.vibrate(50);
            showCustomContextMenu(e, textToCopy);
        }, 1200); 
    };
    const cancelPress = () => { clearTimeout(pressTimer); };

    element.addEventListener("touchstart", startPress, { passive: true });
    element.addEventListener("touchend", cancelPress);
    element.addEventListener("touchmove", cancelPress);
    element.addEventListener("mousedown", startPress);
    element.addEventListener("mouseup", cancelPress);
    element.addEventListener("mouseleave", cancelPress);
}

function showCustomContextMenu(e, text) {
    e.preventDefault();
    removeContextMenu();

    const menu = document.createElement("div");
    menu.className = "custom-context-menu";
    
    const item = document.createElement("div");
    item.className = "context-menu-item";
    item.innerText = "نسخ الرسالة";
    item.onclick = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => { alert("تم نسخ نص الرسالة بنجاح!"); });
        } else {
            alert("تعذر نسخ النص تلقائياً عبر جهازك");
        }
        removeContextMenu();
    };

    menu.appendChild(item);
    document.body.appendChild(menu);

    let posX = e.pageX || (e.touches ? e.touches[0].pageX : 0);
    let posY = e.pageY || (e.touches ? e.touches[0].pageY : 0);

    menu.style.left = `${posX}px`;
    menu.style.top = `${posY}px`;

    activeContextMenu = menu;
    setTimeout(() => { document.addEventListener("click", removeContextMenuOutside); }, 10);
}

function removeContextMenu() {
    if (activeContextMenu) {
        activeContextMenu.remove();
        activeContextMenu = null;
    }
    document.removeEventListener("click", removeContextMenuOutside);
}

function removeContextMenuOutside(e) {
    if (activeContextMenu && !activeContextMenu.contains(e.target)) {
        removeContextMenu();
    }
}

function generateReferralCode(username) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < 4; i++) { randomString += chars.charAt(Math.floor(Math.random() * chars.length)); }
    const cleanUsername = username.replace(/\s+/g, '').substring(0, 3).toLowerCase();
    return `${cleanUsername}-${randomString}`;
}

// إعدادات اتصال Supabase المباشر
const supabaseUrl = 'https://penavltenjklmpovdgcm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbmF2bHRlbmprbG1wb3ZkZ2NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4ODcxNTQsImV4cCI6MjA5OTQ2MzE1NH0.IchDJ9w3UDF1nxZwvoGacxB6O_hdDOgpcKfTM39mrd4';

const _supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

let isSignUp = false;
let myProfile = null;
let isSavingUser = false;
let isChatLocked = false;
let activeSupportRoomId = null;
let currentActivePage = 'chat'; 
let tempUserDataAfterSignUp = null;
let activeContextMenu = null;

function log(text) {
    const m = document.getElementById('monitor');
    if (m) { m.innerHTML += "<br>> " + text; m.scrollTop = m.scrollHeight; }
}

function setupContactMailLink(username = '') {
    const mailLink = document.getElementById('contact-mail-link');
    if (mailLink) {
        const subject = encodeURIComponent(`تواصل من موظف - ${username || 'Job Syria'}`);
        mailLink.href = `mailto:zakaria728292@gmail.com?subject=${subject}`;
    }
}

window.onload = async function() {
    log("بدء تشغيل التطبيق وفحص الجلسة...");
    await requestAppPermissionsOnFirstLaunch();
    checkReferralInURL();
    setupContactMailLink();

    if (!_supabase) {
        log("❌ خطأ: لم يتم الاتصال بـ Supabase.");
        return;
    }

    try {
        const { data, error } = await _supabase.auth.getSession();
        if (error) { log("خطأ جلسة: " + error.message); return; }
        if (data && data.session) {
            checkUserSession(data.session.user.id);
        } else { log("جاهز للعمل."); }
    } catch (e) { log("خطأ الإقلاع: " + e.message); }
};

function checkReferralInURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    if (refCode) {
        localStorage.setItem('referred_by', refCode.trim());
    }
}

function forceClearSession() {
    localStorage.clear();
    if (_supabase) _supabase.auth.signOut();
    setTimeout(() => { location.reload(); }, 300);
}

function toggleAuthMode() {
    isSignUp = !isSignUp;
    document.getElementById('submit-auth-btn').innerText = isSignUp ? 'إنشاء حساب جديد' : 'تسجيل الدخول';
    document.getElementById('toggle-auth-btn').innerText = isSignUp ? 'لديك حساب؟ سجل دخولك' : 'ليس لديك حساب؟ أنشئ حساباً جديداً';
}

async function submitAuth() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    if(!email || !password) return alert('الرجاء كتابة البريد وكلمة المرور');
    if (password.length < 8) return alert("كلمة المرور يجب أن تكون 8 خانات أو أكثر");

    try {
        if(isSignUp) {
            const { data, error } = await _supabase.auth.signUp({ email, password });
            if(error) return alert(error.message);
            
            if (data && data.user) {
                tempUserDataAfterSignUp = data.user;
                await _supabase.auth.signInWithPassword({ email, password });
                document.getElementById('credentials-inputs').classList.add('hidden');
                document.getElementById('username-inputs').classList.remove('hidden');
            }
        } else {
            const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
            if(error) return alert(error.message);
            checkUserSession(data.user.id);
        }
    } catch (e) { log("❌ خطأ: " + e.message); }
}

async function saveUsername() {
    if (isSavingUser) return;
    const username = document.getElementById('username').value.trim();
    if(!username) return alert('الرجاء كتابة اسم مستعار');
    
    try {
        isSavingUser = true;
        const { data: existingUser } = await _supabase.from('profiles').select('username').eq('username', username).maybeSingle();
        if (existingUser) {
            alert("عذراً، هذا الاسم محجوز بالفعل");
            isSavingUser = false;
            return;
        }
        
        let currentUser = null;
        const { data: sessionData } = await _supabase.auth.getUser();
        if (sessionData && sessionData.user) currentUser = sessionData.user;
        else if (tempUserDataAfterSignUp) currentUser = tempUserDataAfterSignUp;

        if (!currentUser) {
            alert("حدث خطأ بالجلسة، يرجى إعادة تسجيل الدخول.");
            forceClearSession();
            return;
        }

        const myReferralCode = generateReferralCode(username);
        const invitedBy = localStorage.getItem('referred_by') || null;
        localStorage.removeItem('referred_by');
        
        const { error } = await _supabase.from('profiles').upsert({ 
            id: currentUser.id, username: username, email: currentUser.email,
            role: 'موظف', is_banned: false, referral_code: myReferralCode,
            referred_by: invitedBy, referral_count: 0, salary: 0, syriatel_cash: ''
        });
        
        if(error) { alert(error.message); isSavingUser = false; return; }

        const welcomeMessage = `أهلاً بكم في تطبيق [ job syria ] \n\nشارك التطبيق من خلال رابط الإحالة الخاص بك "ستجده في قائمة الإعدادات" \n\nواكسب جوائز ستضاف الى راتبك على كل احالة\n\n^لستم ملزمون بوقت عمل محدد ^`;
        
        await _supabase.from('private_chats').insert({
            sender_id: 'f81b4a91-2416-4c7d-b095-c1cdd9fa6a47', 
            sender_name: 'Team leader', username: 'Team leader',
            message_text: welcomeMessage, role: 'مدير', room_id: currentUser.id, is_read: false 
        });

        if (invitedBy) { await processReferralReward(invitedBy); }
        tempUserDataAfterSignUp = null;
        checkUserSession(currentUser.id);
    } catch (e) { log("❌ خطأ: " + e.message); } finally { isSavingUser = false; }
}

async function processReferralReward(refCode) {
    try {
        const { data: inviter } = await _supabase.from('profiles').select('id, salary, referral_count').eq('referral_code', refCode).maybeSingle();
        if (inviter) {
            const currentSalary = parseFloat(inviter.salary) || 0;
            const currentCount = parseInt(inviter.referral_count) || 0;
            await _supabase.from('profiles').update({ salary: currentSalary + 2500, referral_count: currentCount + 1 }).eq('id', inviter.id);
        }
    } catch (err) {}
}

async function loadEmployeeCount() {
    try {
        const { count, error } = await _supabase.from('profiles').select('*', { count: 'exact', head: true });
        if (!error && count !== null) document.getElementById('employee-online-count').innerText = count;
    } catch(e) {}
}

async function checkUnreadSupportNotification(uid) {
    if (!uid) return;
    try {
        const cleanUid = String(uid).trim().toLowerCase();
        const { data: unreadSupportMsgs } = await _supabase.from('private_chats').select('id').eq('room_id', cleanUid).eq('is_read', false).neq('sender_id', cleanUid).limit(1);
        const badge = document.getElementById('support-badge');
        if (unreadSupportMsgs && unreadSupportMsgs.length > 0) badge?.classList.remove('hidden');
        else badge?.classList.add('hidden');
    } catch (err) {}
}

async function checkUserSession(uid) {
    try {
        let { data: profile } = await _supabase.from('profiles').select().eq('id', uid).maybeSingle();
        if(!profile) {
            document.getElementById('credentials-inputs').classList.add('hidden');
            document.getElementById('username-inputs').classList.remove('hidden');
            return;
        }

        if (profile.is_banned) {
            alert("تم حظر حسابك من دخول التطبيق من قبل الإدارة!");
            forceClearSession();
            return;
        }

        if (!profile.referral_code) {
            const newGeneratedCode = generateReferralCode(profile.username);
            await _supabase.from('profiles').update({ referral_code: newGeneratedCode, referral_count: 0 }).eq('id', uid);
            const { data: updatedProfile } = await _supabase.from('profiles').select().eq('id', uid).single();
            profile = updatedProfile;
        }
        
        myProfile = profile;
        setupContactMailLink(myProfile.username);

        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('main-section').classList.remove('hidden');
        
        document.getElementById('my-salary').innerText = profile.salary || 0;
        document.getElementById('my-referrals-count').innerText = profile.referral_count || 0;
        document.getElementById('new-username').value = profile.username;
        if(profile.syriatel_cash) document.getElementById('syriatel-cash-input').value = profile.syriatel_cash;

        const isStaff = ['admin', 'مدير', 'مدير مالي'].includes(profile.role);
        if (isStaff) {
            const { data: unreadForAdmin } = await _supabase.from('private_chats').select('id').eq('is_read', false).neq('role', 'مدير').neq('role', 'admin').neq('role', 'مدير مالي').limit(1);
            if (unreadForAdmin && unreadForAdmin.length > 0) document.getElementById('support-badge').classList.remove('hidden');
        } else {
            activeSupportRoomId = myProfile.id; 
            await checkUnreadSupportNotification(myProfile.id);
        }

        await loadSupportRoomsSelector();

        if(isStaff) {
            document.getElementById('nav-admin').classList.remove('hidden');
            document.getElementById('chat-admin-panel').classList.remove('hidden');
            loadAdminPanel();
        }

        setupChatRealtime();
        setupSupportRealtime();
        listenToChatSettings();
        listenToBans(uid);
        loadEmployeeCount(); 
    } catch(e) { log("❌ خطأ: " + e.message); }
}

function listenToBans(uid) {
    _supabase.channel('my_ban_status').on('postgres_changes', { event: 'UPDATE', table: 'profiles', filter: `id=eq.${uid}` }, payload => {
        if (payload.new.is_banned) {
            alert("تم حظر حسابك الآن من قبل الإدارة!");
            forceClearSession();
        }
    }).subscribe();
}

async function listenToChatSettings() {
    try {
        const { data } = await _supabase.from('system_settings').select().eq('key', 'chat_locked').maybeSingle();
        if (data) applyChatLockState(data.value === 'true');
    } catch (e) {}

    _supabase.channel('sys_settings').on('postgres_changes', { event: 'UPDATE', table: 'system_settings', filter: 'key=eq.chat_locked' }, payload => {
        applyChatLockState(payload.new.value === 'true');
    }).subscribe();
}

function applyChatLockState(locked) {
    isChatLocked = locked;
    const statusLbl = document.getElementById('chat-status-lbl');
    const toggleBtn = document.getElementById('toggle-chat-btn');
    const inputField = document.getElementById('msg-text');
    const sendBtn = document.getElementById('send-msg-btn');
    const isStaff = ['admin', 'مدير', 'مدير مالي'].includes(myProfile?.role);

    if(locked) {
        if(statusLbl) { statusLbl.innerText = "مغلقة 🔒"; statusLbl.style.color = "var(--red)"; }
        if(toggleBtn) toggleBtn.innerText = "فتح الدردشة 🔓";
        if(!isStaff) {
            inputField.disabled = true;
            inputField.placeholder = "الدردشة مغلقة مؤقتاً من قبل الإدارة";
            sendBtn.disabled = true;
        }
    } else {
        if(statusLbl) { statusLbl.innerText = "مفتوحة 🔓"; statusLbl.style.color = "var(--green)"; }
        if(toggleBtn) toggleBtn.innerText = "قفل الدردشة 🔒";
        inputField.disabled = false;
        inputField.placeholder = "اكتب رسالتك...";
        sendBtn.disabled = false;
    }
}

function checkChatInputFocus() {
    const isStaff = ['admin', 'مدير', 'مدير مالي'].includes(myProfile?.role);
    if (isChatLocked && !isStaff) {
        alert("عذراً، تم قفل الدردشة مؤقتاً من قبل المسؤول");
        document.getElementById('msg-text').blur(); 
    }
}

async function toggleChatLockState() {
    const newState = !isChatLocked;
    try {
        await _supabase.from('system_settings').update({ value: newState.toString() }).eq('key', 'chat_locked');
        applyChatLockState(newState);
    } catch (e) { applyChatLockState(newState); }
}

async function updateSyriatelCash() {
    if(!myProfile) return alert("الرجاء تسجيل الدخول أولاً");
    const cashCode = document.getElementById('syriatel-cash-input').value.trim();
    const { error } = await _supabase.from('profiles').update({ syriatel_cash: cashCode }).eq('id', myProfile.id);
    if(error) alert(error.message);
    else { alert("تم حفظ الرمز بنجاح! 🎉"); myProfile.syriatel_cash = cashCode; }
}

function copyReferralLink() {
    if (!myProfile || !myProfile.referral_code) return alert('الرجاء الانتظار...');
    const baseUrl = "https://teal-douhua-036004.netlify.app/"; 
    const referralLink = `${baseUrl}?ref=${myProfile.referral_code}`;
    const formattedText = `تطبيق للعمل اون لاين في سوريا 🇸🇾✨\nسجل الآن وابدأ بربح راتبك المباشر اليومي عبر الإحالات والمهام:\n${referralLink}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(formattedText).then(() => { alert(`تم نسخ رابط الإحالة الخاص بك بنجاح! 🎉`); });
    } else {
        prompt("انسخ رابط الإحالة الخاص بك مباشرة من هنا:", formattedText);
    }
}

function switchPage(p) {
    currentActivePage = p; 
    document.querySelectorAll('.page').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(`page-${p}`).classList.remove('hidden');
    document.getElementById(`nav-${p}`).classList.add('active');
    
    if (p === 'support') {
        document.getElementById('support-badge').classList.add('hidden');
        if (myProfile && !['admin', 'مدير', 'مدير مالي'].includes(myProfile.role)) {
            markRoomAsRead(myProfile.id);
        }
    }
}

async function sendMessage() {
    const text = document.getElementById('msg-text').value.trim();
    if(!text) return;
    if (checkProfanity(text)) return alert("تعذر الإرسال: تحتوي الرسالة على كلمات غير لائقة!");

    const isStaff = ['admin', 'مدير', 'مدير مالي'].includes(myProfile.role);
    if (isChatLocked && !isStaff) return alert("عذراً، الشات مغلق حالياً من قبل الإدارة.");

    await _supabase.from('messages').insert({ user_id: myProfile.id, username: myProfile.username, message_text: text, role: myProfile.role });
    document.getElementById('msg-text').value = '';
}

function setupChatRealtime() {
    document.getElementById('chat-box').innerHTML = '';
    _supabase.from('messages').select().order('created_at').then(({ data }) => {
        if(data) data.forEach(msg => appendMessage(msg, 'chat-box'));
    });
    _supabase.channel('msgs').on('postgres_changes', { event: 'INSERT', table: 'messages' }, p => {
        appendMessage(p.new, 'chat-box');
    }).subscribe();

    _supabase.channel('profiles_counter').on('postgres_changes', { event: '*', table: 'profiles' }, () => {
        loadEmployeeCount();
    }).subscribe();
}

async function markRoomAsRead(roomId) {
    if(!roomId || !myProfile) return;
    try {
        await _supabase.from('private_chats').update({ is_read: true }).eq('room_id', roomId).eq('is_read', false).neq('sender_id', myProfile.id);
    } catch (e) {}
}

async function loadSupportRoomsSelector() {
    const selector = document.getElementById('support-room-selector');
    const label = document.getElementById('support-select-label');
    if(!selector || !myProfile) return;

    const isStaff = ['admin', 'مدير', 'مدير مالي'].includes(myProfile.role);

    if (isStaff) {
        label.innerText = "اختر غرفة العميل/الموظف للرد عليه:";
        const { data: users } = await _supabase.from('profiles').select('id, username').eq('role', 'موظف');
        
        let unreadRooms = new Set();
        try {
            const { data: unreadData } = await _supabase.from('private_chats').select('room_id, sender_id').eq('is_read', false);
            if (unreadData) {
                unreadData.forEach(msg => {
                    const rId = String(msg.room_id).trim().toLowerCase();
                    const sId = String(msg.sender_id).trim().toLowerCase();
                    if (sId === rId) unreadRooms.add(rId);
                });
            }
        } catch (e) {}

        if(users && users.length > 0) {
            const currentSelected = selector.value || activeSupportRoomId || users[0].id;
            selector.innerHTML = users.map(u => {
                const userIdClean = String(u.id).trim().toLowerCase();
                const activeRoomClean = activeSupportRoomId ? String(activeSupportRoomId).trim().toLowerCase() : '';
                const hasUnread = unreadRooms.has(userIdClean) && userIdClean !== activeRoomClean;
                return `<option value="${u.id}" ${u.id === currentSelected ? 'selected' : ''}>${u.username}${hasUnread ? ' 🔴' : ''}</option>`;
            }).join('');
            
            if(!activeSupportRoomId) { 
                activeSupportRoomId = currentSelected; 
                await markRoomAsRead(activeSupportRoomId);
            }
        } else selector.innerHTML = '<option value="">لا يوجد موظفين مسجلين حالياً</option>';
    } else {
        label.innerText = "اختر الشخص المسؤول للبدء بالتواصل معه:";
        const { data: staffList } = await _supabase.from('profiles').select('id, username, role').in('role', ['admin', 'مدير', 'مدير مالي']);
        if (staffList && staffList.length > 0) {
            selector.innerHTML = staffList.map(s => `<option value="${myProfile.id}">${s.username} (${s.role})</option>`).join('');
            activeSupportRoomId = myProfile.id;
        } else {
            selector.innerHTML = `<option value="${myProfile.id}">الإدارة العامة (مدير)</option>`;
            activeSupportRoomId = myProfile.id;
        }
    }
}

async function changeSupportActiveRoom(roomId) {
    activeSupportRoomId = roomId;
    await markRoomAsRead(roomId);
    await loadSupportRoomsSelector(); 
    setupSupportRealtime(); 
}

async function sendSupportMessage() {
    const text = document.getElementById('support-msg-text').value.trim();
    if(!text) return;
    if (checkProfanity(text)) return alert("تعذر الإرسال: تحتوي الرسالة على كلمات غير لائقة!");
    if(!activeSupportRoomId) return alert("عذراً، لم يتم تحديد غرفة دعم بعد!");

    await _supabase.from('private_chats').insert({ 
        sender_id: myProfile.id, sender_name: myProfile.username, username: myProfile.username, 
        message_text: text, role: myProfile.role, room_id: activeSupportRoomId, is_read: false
    });
    document.getElementById('support-msg-text').value = '';
}

const imageUploadElem = document.getElementById('image-upload');
if (imageUploadElem) {
    imageUploadElem.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if(!file || !myProfile || !activeSupportRoomId) return;
        
        log("جاري رفع الصورة...");
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await _supabase.storage.from('chat-media').upload(`private/${fileName}`, file);
        if(uploadError) return alert("خطأ في رفع الصورة: " + uploadError.message);

        const { data } = _supabase.storage.from('chat-media').getPublicUrl(`private/${fileName}`);
        
        await _supabase.from('private_chats').insert({
            sender_id: myProfile.id, sender_name: myProfile.username, username: myProfile.username,
            image_url: data.publicUrl, role: myProfile.role, room_id: activeSupportRoomId, is_read: false
        });
    });
}

async function loadSupportMessages(roomId) {
    const box = document.getElementById('support-box');
    if(!box || !roomId) return;
    let { data } = await _supabase.from('private_chats').select('*').eq('room_id', roomId).order('created_at');
    box.innerHTML = '';
    if(data) data.forEach(msg => appendMessage(msg, 'support-box')); 
}

async function setupSupportRealtime() {
    const box = document.getElementById('support-box');
    if(!box || !activeSupportRoomId) return;
    box.innerHTML = '';

    const isStaff = ['مدير', 'admin', 'مدير مالي'].includes(myProfile.role);

    if (currentActivePage === 'support' && activeSupportRoomId === myProfile.id) {
        await markRoomAsRead(activeSupportRoomId);
    }
    
    await loadSupportMessages(activeSupportRoomId);

    _supabase.channel('private_chats_global_channel').unsubscribe();

    _supabase.channel('private_chats_global_channel')
        .on('postgres_changes', { event: 'INSERT', table: 'private_chats' }, async p => {
            const newMsg = p.new;
            const isSenderStaff = ['مدير', 'admin', 'مدير مالي'].includes(newMsg.role);
            
            if (newMsg.room_id === activeSupportRoomId) {
                appendMessage(newMsg, 'support-box');
                if (newMsg.sender_id !== myProfile.id && currentActivePage === 'support') {
                    await markRoomAsRead(activeSupportRoomId);
                }
            } 

            if (newMsg.sender_id !== myProfile.id) {
                if (!isStaff && newMsg.room_id === myProfile.id && isSenderStaff) {
                    triggerNotification(`رسالة هامة من الإدارة 🔔`, newMsg.message_text || "أرسل صورة 📷", newMsg.image_url);
                }
                else if (isStaff && !isSenderStaff) {
                    if (newMsg.room_id !== activeSupportRoomId || document.hidden || currentActivePage !== 'support') {
                        triggerNotification(`دعم فني من: ${newMsg.sender_name}`, newMsg.message_text || "أرسل صورة 📷", newMsg.image_url);
                    }
                }
            }

            if (newMsg.sender_id !== myProfile.id) {
                if (isStaff && newMsg.room_id !== activeSupportRoomId && !isSenderStaff) {
                    document.getElementById('support-badge').classList.remove('hidden');
                    await loadSupportRoomsSelector();
                } else if (!isStaff && newMsg.room_id === myProfile.id && currentActivePage !== 'support') {
                    document.getElementById('support-badge').classList.remove('hidden');
                }
            }
        })
        .on('postgres_changes', { event: 'UPDATE', table: 'private_chats' }, async p => {
            if (p.new.room_id === activeSupportRoomId) await loadSupportMessages(activeSupportRoomId);
        }).subscribe();
}

function appendMessage(msg, boxId) {
    const box = document.getElementById(boxId);
    if(box) {
        const isGreenRole = msg.username === "Team leader" || msg.sender_name === "Team leader" || msg.role === "مدير" || msg.role === "admin" || msg.role === "مدير مالي";
        const userClass = isGreenRole ? "msg-user msg-green" : "msg-user";
        const textRaw = msg.message_text || '';
        
        let content = msg.message_text ? `<div>${linkify(textRaw)}</div>` : '';
        if(msg.image_url) {
            content += `<img src="${msg.image_url}" class="chat-img" alt="صورة مرفقة" onclick="window.open('${msg.image_url}', '_blank')">`;
        }
        
        let checkmark = '';
        if (boxId === 'support-box' && msg.sender_id === myProfile.id) {
            checkmark = msg.is_read ? ' <span style="color: #34c759; font-size: 11px; margin-right: 5px;">✔️✔️</span>' : ' <span style="color: #888; font-size: 11px; margin-right: 5px;">✔️</span>';
        }
        
        const msgElement = document.createElement('div');
        msgElement.className = 'msg';
        msgElement.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="${userClass}">${msg.username || msg.sender_name || "مستخدم"}</span>
                ${checkmark}
            </div>
            ${content}
        `;
        
        attachLongPressListener(msgElement, textRaw);
        box.appendChild(msgElement);
        box.scrollTop = box.scrollHeight;
    }
}

async function updateUsername() {
    const newName = document.getElementById('new-username').value.trim();
    if(!newName) return;
    const { error } = await _supabase.from('profiles').update({ username: newName }).eq('id', myProfile.id);
    if(error) alert('الاسم مستخدم مسبقاً');
    else { alert('تم التحديث!'); location.reload(); }
}

function logout() { forceClearSession(); }

async function loadAdminPanel() {
    const { data } = await _supabase.from('profiles').select().order('username');
    const listDiv = document.getElementById('employees-list');
    listDiv.innerHTML = '';
    
    if(data) {
        let totalEmployees = 0; let totalAdmins = 0;
        data.forEach(emp => {
            const role = emp.role || 'موظف';
            if(role === 'موظف' || role === 'User') totalEmployees++; else totalAdmins++;
        });

        listDiv.innerHTML += `
            <div style="background: #1a1a1a; border: 1px solid var(--gold); padding: 12px; border-radius: 12px; margin-bottom: 15px; display: flex; justify-content: space-around; text-align: center;">
                <div>
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">👥 الموظفين</div>
                    <div style="font-size: 18px; color: var(--gold); font-weight: bold;">${totalEmployees}</div>
                </div>
                <div style="border-left: 1px solid #333; height: 35px; align-self: center;"></div>
                <div>
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">🛡️ المسؤولين</div>
                    <div style="font-size: 18px; color: #00ff00; font-weight: bold;">${totalAdmins}</div>
                </div>
                <div style="border-left: 1px solid #333; height: 35px; align-self: center;"></div>
                <div>
                    <div style="font-size: 11px; color: #888; margin-bottom: 4px;">📊 الإجمالي</div>
                    <div style="font-size: 18px; color: #fff; font-weight: bold;">${data.length}</div>
                </div>
            </div>`;

        data.forEach(emp => {
            const isUserBanned = emp.is_banned === true;
            const userRole = emp.role || 'موظف';
            const isManager = myProfile.role === 'مدير';
            const isFinancialManager = myProfile.role === 'مدير مالي';
            const isAdmin = myProfile.role === 'admin';
            const isTargetEmployee = userRole === 'موظف';

            const roleSelector = isManager ? `
                <select onchange="updateUserRole('${emp.id}', this.value)" style="width:auto; padding: 4px; font-size:11px; margin-top:5px; display:inline-block; height: auto; margin-bottom:0;">
                    <option value="موظف" ${userRole === 'موظف' ? 'selected' : ''}>موظف</option>
                    <option value="admin" ${userRole === 'admin' ? 'selected' : ''}>admin</option>
                    <option value="مدير مالي" ${userRole === 'مدير مالي' ? 'selected' : ''}>مدير مالي</option>
                    <option value="مدير" ${userRole === 'مدير' ? 'selected' : ''}>مدير</option>
                </select>
            ` : '';

            let banBtn = '';
            if (isManager || (isAdmin && isTargetEmployee)) {
                banBtn = `<button onclick="toggleUserBan('${emp.id}', ${isUserBanned})" style="width:auto; font-size:11px; margin-top:5px; ${isUserBanned ? 'background-color: var(--green); color: white;' : 'background-color: var(--red); color: white;'}">${isUserBanned ? '🔓 فك الحظر' : '🚫 حظر وطرد'}</button>`;
            }

            let salaryModifierArea = '';
            if (isManager || isFinancialManager) {
                salaryModifierArea = `
                    <div style="margin-top: 8px; display: flex; gap: 4px; align-items: center;">
                        <input type="number" id="salary-input-${emp.id}" value="${emp.salary || 0}" style="width: 100px; padding: 4px; font-size: 12px; margin: 0; background: #333; border: 1px solid var(--gold); text-align: center;">
                        <button onclick="updateUserSalary('${emp.id}')" style="width: auto; padding: 4px 10px; font-size: 11px; background-color: var(--green); color: white;">💾 حفظ الراتب</button>
                    </div>
                `;
            }

            listDiv.innerHTML += `
                <div class="admin-card" style="${isUserBanned ? 'border-color: var(--red); opacity: 0.8;' : ''}">
                    <strong>${emp.username}</strong> ${isUserBanned ? '<span style="color:var(--red); font-weight:bold;">(محظور)</span>' : ''}<br>
                    الرتبة: <span style="color: var(--gold); font-weight:bold;">${userRole}</span><br>
                    الراتب الحالي: ${emp.salary || 0} ل.س<br>
                    إحالاته: ${emp.referral_count || 0}<br>
                    كود دعوته: ${emp.referral_code || 'غير منشأ'}<br>
                    سيريتل كاش: ${emp.syriatel_cash || 'لم يربط بعد'}<br>
                    ${salaryModifierArea}
                    <div style="margin-top: 5px; display: flex; flex-wrap: wrap; gap: 5px; align-items:center;">
                        ${roleSelector}
                        ${banBtn}
                    </div>
                </div>`;
        });
    }
}

async function updateUserSalary(id) {
    const inputField = document.getElementById(`salary-input-${id}`);
    if (!inputField) return;
    const newSalary = parseFloat(inputField.value);
    if (isNaN(newSalary) || newSalary < 0) return alert("الرجاء إدخال قيمة راتب صحيحة!");
    if (myProfile.role !== 'مدير' && myProfile.role !== 'مدير مالي') return alert("عذراً، رتبة مدير أو مدير مالي فقط من تملك الصلاحية!");

    try {
        const { error } = await _supabase.from('profiles').update({ salary: newSalary }).eq('id', id);
        if (error) alert("فشل التحديث: " + error.message);
        else { alert("تم تحديث وحفظ الراتب بنجاح! 🎉"); loadAdminPanel(); }
    } catch(e) { alert("خطأ: " + e.message); }
}

async function toggleUserBan(id, currentBanStatus) {
    if (confirm(currentBanStatus ? "هل أنت متأكد من فك حظر هذا المستخدم؟" : "هل أنت متأكد من حظر وطرد هذا المستخدم؟")) {
        const { error } = await _supabase.from('profiles').update({ is_banned: !currentBanStatus }).eq('id', id);
        if (error) alert("خطأ: " + error.message);
        else { alert("تم التحديث بنجاح!"); loadAdminPanel(); }
    }
}

async function updateUserRole(id, newRole) {
    if (myProfile.role !== 'مدير') return alert("عذراً، رتبة مدير فقط هي من تملك الصلاحية!");
    const { error } = await _supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) alert(error.message);
    else { alert("تم تعديل الرتبة بنجاح!"); loadAdminPanel(); }
}
