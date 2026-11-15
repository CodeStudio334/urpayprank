document.addEventListener("DOMContentLoaded", function() {
    // 1. منع التكبير والتصغير (Zoom In / Zoom Out) نهائياً
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        document.head.appendChild(meta);
    }

    // منع حركة اللمس المزدوج للتكبير (Double-tap to zoom) في الهواتف
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);

    // 2. إخفاء شريط المحاكاة العلوي وتطهير السجلات الوهمية القديمة
    const demoBar = document.querySelector('.demo');
    if (demoBar) demoBar.style.display = 'none';

    let transactions = JSON.parse(localStorage.getItem('ursim-transactions') || '[]');
    transactions = transactions.filter(t => !t.name.includes('محتوى توضيحي') && !t.name.includes('تجريبي'));
    localStorage.setItem('ursim-transactions', JSON.stringify(transactions));

    // 3. واجهة اختيار طريقة الدفع عند الضغط على "إضافة أموال"
    const editBalanceBtns = [document.getElementById('editBalance'), document.getElementById('editBalance2')];
    editBalanceBtns.forEach(btn => {
        if (btn) {
            btn.onclick = function(e) {
                e.preventDefault();
                showPaymentMethodsModal();
            };
        }
    });

    function showPaymentMethodsModal() {
        const dialog = document.getElementById('dialog');
        const modal = dialog.querySelector('.modal');
        
        modal.innerHTML = `
            <button class="close" id="closeModal" style="float: left; border: 0; background: #eee; border-radius: 50%; height: 32px; width: 32px; cursor: pointer;">✕</button>
            <h2 style="margin: 0 0 5px; font-size: 20px;">طريقة الدفع</h2>
            <p style="color: #666; font-size: 13px; margin-bottom: 20px;">يرجى اختيار طريقة الدفع.</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="openAmountInput('أبل باي')">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: #000; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: bold; font-size: 14px;"> Pay</div>
                    <div>
                        <div style="font-weight: bold; font-size: 15px;">أبل باي</div>
                        <div style="font-size: 12px; color: #666;">مدفوعات سريعة</div>
                    </div>
                </div>
                <div>➔</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="openAmountInput('بطاقة الائتمان')">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 20px;">💳</div>
                    <div>
                        <div style="font-weight: bold; font-size: 15px;">بطاقات الخصم / الائتمان</div>
                        <div style="font-size: 12px; color: #666;">0 البطاقات المحفوظة</div>
                    </div>
                </div>
                <div>➔</div>
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 15px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; cursor: pointer;" onclick="openAmountInput('نقاط مكافأة')">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="background: #e0f2fe; color: #0284c7; padding: 8px; border-radius: 8px; font-weight: bold; font-size: 12px;">مكافأة</div>
                    <div>
                        <div style="font-weight: bold; font-size: 15px;">نقاط مكافأة</div>
                        <div style="font-size: 12px; color: #666;">0 نقطة = 1 ﷼</div>
                    </div>
                </div>
                <div>➔</div>
            </div>
        `;
        
        dialog.classList.add('show');
        document.getElementById('closeModal').onclick = () => { dialog.classList.remove('show'); setTimeout(location.reload, 300); };
    }

    window.openAmountInput = function(method) {
        const dialog = document.getElementById('dialog');
        const modal = dialog.querySelector('.modal');
        
        modal.innerHTML = `
            <button class="close" id="closeModal" style="float: left; border: 0; background: #eee; border-radius: 50%; height: 32px; width: 32px; cursor: pointer;">✕</button>
            <h2 style="margin: 0 0 10px; font-size: 20px;">إضافة أموال عبر ${method}</h2>
            <p style="color: #666; font-size: 13px; margin-bottom: 15px;">أدخل المبلغ المراد إضافته إلى رصيدك المتاح.</p>
            <input id="addedAmount" class="field" type="number" min="1" step="0.01" placeholder="أدخل المبلغ (ريال)" style="width:100%; padding:12px; border:1px solid #ccc; border-radius:10px; margin-bottom:15px;">
            <button class="primary" id="confirmAdd" style="background:#205bf2; color:#fff; border:0; padding:12px; width:100%; border-radius:10px; font-weight:bold; cursor:pointer;">تأكيد الدفع</button>
        `;

        document.getElementById('closeModal').onclick = () => { dialog.classList.remove('show'); setTimeout(location.reload, 300); };
        
        document.getElementById('confirmAdd').onclick = function() {
            let addVal = Number(document.getElementById('addedAmount').value);
            if (!Number.isFinite(addVal) || addVal <= 0) {
                alert('الرجاء إدخال مبلغ صالح');
                return;
            }
            let currentBal = Number(localStorage.getItem('ursim-balance') || 4267.00);
            currentBal = Math.round((currentBal + addVal) * 100) / 100;
            localStorage.setItem('ursim-balance', JSON.stringify(currentBal));
            
            dialog.classList.remove('show');
            alert('تم إضافة المبلغ بنجاح وتحديث الرصيد!');
            location.reload();
        };
    };

    // 4. عملية التحويل وإظهار واجهة التحقق (المربعات الأربعة المطلوبة برمز 5111)
    const doTransferBtn = document.getElementById('doTransfer');
    if (doTransferBtn) {
        const newBtn = doTransferBtn.cloneNode(true);
        doTransferBtn.parentNode.replaceChild(newBtn, doTransferBtn);
        
        newBtn.addEventListener('click', function() {
            const name = document.getElementById('recipient').value.trim();
            const iban = document.getElementById('iban').value.replace(/\s/g, '').toUpperCase();
            const amountInput = document.getElementById('amount').value;
            const n = Number(amountInput);

            if (!/^SA[0-9A-Z]{22}$/.test(iban)) {
                alert('أدخل رقم IBAN سعودي صالح بصيغة SA متبوعًا بـ22 خانة.');
                return;
            }
            if (!name || !Number.isFinite(n) || n <= 0) {
                alert('أدخل اسمًا ومبلغًا صالحًا.');
                return;
            }

            const dialog = document.getElementById('dialog');
            const modal = dialog.querySelector('.modal');
            
            let timeLeft = 177;
            
            function formatTime(seconds) {
                let m = Math.floor(seconds / 60);
                let s = seconds % 60;
                return `${m}:${s < 10 ? '0' : ''}${s}`;
            }

            modal.innerHTML = `
                <div style="text-align: center; font-family: system-ui, sans-serif;">
                    <h2 style="font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #111;">Verification code</h2>
                    <p style="color: #666; font-size: 13px; margin-bottom: 25px; line-height: 1.4;">
                        Please enter the code you received<br>on your mobile 05XXXX6189
                    </p>

                    <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 25px;" dir="ltr">
                        <input type="password" maxlength="1" class="otp-box" style="width: 50px; height: 60px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid #cbd5e1; border-radius: 12px; outline: none; background: #fff;" autofocus>
                        <input type="password" maxlength="1" class="otp-box" style="width: 50px; height: 60px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid #cbd5e1; border-radius: 12px; outline: none; background: #fff;">
                        <input type="password" maxlength="1" class="otp-box" style="width: 50px; height: 60px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid #cbd5e1; border-radius: 12px; outline: none; background: #fff;">
                        <input type="password" maxlength="1" class="otp-box" style="width: 50px; height: 60px; text-align: center; font-size: 24px; font-weight: bold; border: 2px solid #cbd5e1; border-radius: 12px; outline: none; background: #fff;">
                    </div>

                    <div style="font-size: 13px; color: #666; margin-bottom: 5px;">Time remaining to resend</div>
                    <div id="resendTimer" style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 15px;">${formatTime(timeLeft)}</div>
                    <div style="color: #d97706; font-size: 13px; cursor: pointer; margin-bottom: 20px; font-weight: 500;">Resend verification Code</div>

                    <button id="verifyOtpBtn" style="background: #205bf2; color: #fff; border: 0; width: 100%; padding: 14px; border-radius: 14px; font-weight: bold; font-size: 16px; cursor: pointer;">تأكيد</button>
                </div>
            `;

            dialog.classList.add('show');

            const boxes = modal.querySelectorAll('.otp-box');
            boxes.forEach((box, index) => {
                box.addEventListener('input', (e) => {
                    let val = e.target.value;
                    if (val && index < boxes.length - 1) {
                        boxes[index + 1].focus();
                    }
                });
                box.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !box.value && index > 0) {
                        boxes[index - 1].focus();
                    }
                });
            });

            const timerInterval = setInterval(() => {
                timeLeft--;
                const tEl = document.getElementById('resendTimer');
                if (tEl) tEl.textContent = formatTime(timeLeft);
                if (timeLeft <= 0) clearInterval(timerInterval);
            }, 1000);

            document.getElementById('verifyOtpBtn').onclick = function() {
                let enteredCode = Array.from(boxes).map(b => b.value).join('');
                
                if (enteredCode !== '5111') {
                    alert('رمز التحقق غير صحيح. تأكد من الرقم الصحيح (5111).');
                    return;
                }

                clearInterval(timerInterval);
                dialog.classList.remove('show');

                let balance = Number(localStorage.getItem('ursim-balance') || 4267.00);
                const v = Math.round(n * 100) / 100;
                balance = Math.round((balance - v) * 100) / 100;
                localStorage.setItem('ursim-balance', JSON.stringify(balance));

                let transactions = JSON.parse(localStorage.getItem('ursim-transactions') || '[]');
                const newTx = {
                    name: name,
                    iban: '•••• ' + iban.slice(-4),
                    date: new Date().toLocaleString('ar-SA'),
                    amount: v,
                    reference: 'TXN-' + Date.now()
                };
                transactions.unshift(newTx);
                localStorage.setItem('ursim-transactions', JSON.stringify(transactions));

                setTimeout(() => {
                    document.getElementById('recipient').value = '';
                    document.getElementById('iban').value = '';
                    document.getElementById('amount').value = '';
                    
                    dialog.querySelector('.modal').innerHTML = `
                        <h2 style="margin: 0 0 10px; font-size: 20px;">تم التحويل بنجاح</h2>
                        <p style="color: #666; font-size: 14px; margin-bottom: 20px;">تم تحويل مبلغ <b>${v.toFixed(2)} ر.س</b> إلى المستفيد <b>${name}</b> بنجاح.</p>
                        <button class="primary" id="showReceiptBtn" style="background:#205bf2; color:#fff; border:0; padding:12px; width:100%; border-radius:10px; font-weight:bold; cursor:pointer;">عرض وطباعة إيصال الدفع</button>
                    `;
                    dialog.classList.add('show');

                    document.getElementById('showReceiptBtn').onclick = function() {
                        dialog.classList.remove('show');
                        if (typeof window.printReceipt === 'function') {
                            window.printReceipt(newTx);
                        }
                        if (typeof window.show === 'function') {
                            window.show('activity');
                        } else {
                            location.reload();
                        }
                    };
                }, 300);
            };
        });
    }

    // 5. دالة طباعة إيصال الراجحي الرسمي
    window.printReceipt = function(t) {
        const old = document.getElementById('printReceipt');
        if (old) old.remove();
        
        const d = document.createElement('section');
        d.id = 'printReceipt';
        
        d.innerHTML = `
            <div style="font-family: system-ui, sans-serif; padding: 30px; direction: rtl; color: #111; max-width: 600px; margin: auto; background: #fff;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #004c97; padding-bottom: 15px; margin-bottom: 20px;">
                    <div>
                        <h2 style="margin: 0; color: #004c97; font-size: 22px;">مصرف الراجحي</h2>
                        <span style="font-size: 13px; color: #555;">Al Rajhi Bank</span>
                    </div>
                    <div style="text-align: left;">
                        <h2 style="margin: 0; font-size: 20px; color: #333;">إيصال التحويل</h2>
                        <span style="font-size: 12px; color: #555;">Transfer Receipt</span>
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 14px; background: #f9f9f9; padding: 10px 15px; border-radius: 8px;">
                    <div><strong>التاريخ Date:</strong> ${t.date}</div>
                    <div><strong>لمستفيد في مصرف الراجحي</strong></div>
                </div>

                <div style="background: #f1f5f9; padding: 10px 15px; font-weight: bold; font-size: 14px; color: #004c97; margin-bottom: 15px; border-radius: 5px;">
                    تفاصيل التحويل / Transfer Details
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px 0; color: #666;">المبلغ / Amount</td>
                        <td style="padding: 12px 0; text-align: left; font-weight: bold; font-size: 16px; color: #004c97;" dir="ltr">${t.amount.toFixed(2)} SAR</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px 0; color: #666;">من / From</td>
                        <td style="padding: 12px 0; text-align: left;" dir="ltr">SA** **** **** **** **** 6233<br><span style="font-size: 12px; color: #555;">Al Rajhi Bank</span></td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px 0; color: #666;">إلى / To (${t.name})</td>
                        <td style="padding: 12px 0; text-align: left; font-weight: bold;" dir="ltr">${t.iban}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #eee;">
                        <td style="padding: 12px 0; color: #666;">الغرض / Purpose</td>
                        <td style="padding: 12px 0; text-align: left;">سداد مستحقات</td>
                    </tr>
                </table>

                <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #666;">
                    <div>
                        <span>Alrajhibank.com.sa</span><br>
                        <strong style="font-size: 15px; color: #333;">920 003 344</strong>
                    </div>
                    <div style="text-align: left; font-family: monospace; color: #999;">
                        مرجع العملية: ${t.reference}
                    </div>
                </div>
            </div>
        `;
        document.body.append(d);
        window.print();
    };

    // 6. تعقيم النصوص
    function replaceTextInNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            text = text.replace(/محاكي تجريبي/g, 'المحفظة الرقمية');
            text = text.replace(/UR SIM/g, 'URPAY');
            text = text.replace(/تجريبي/g, 'رسمي');
            text = text.replace(/محاكاة/g, 'رسمي');
            text = text.replace(/افتراضي/g, 'متاح');
            node.nodeValue = text;
        } else {
            if (node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
                node.childNodes.forEach(child => replaceTextInNode(child));
            }
        }
    }
    replaceTextInNode(document.body);
});