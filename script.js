document.addEventListener('DOMContentLoaded', () => {
    const GOOGLE_APPS_SCRIPT_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbxBEtfFrzsH9AfjiKz2URBshWXjJHlPK6zJtYCjR09_VN6kTqysHAQcrpcw_CRGL-ty/exec';

    const activityTableBody = document.querySelector('.activity-selection-section table tbody');
    const formStatus = document.getElementById('form-status');
    const updateButton = document.getElementById('update-data-manually');

    async function loadDataFromSheet() {
        formStatus.textContent = 'جاري تحميل البيانات...';
        formStatus.className = 'info';

        try {
            const response = await fetch(`${GOOGLE_APPS_SCRIPT_WEB_APP_URL}?timestamp=${new Date().getTime()}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            const filteredData = data.filter(row => row['اسم المشارك'] && String(row['اسم المشارك']).trim() !== '');
            activityTableBody.innerHTML = '';

            if (filteredData.length > 0) {
                filteredData.reverse();

                filteredData.forEach(row => {
                    const tr = document.createElement('tr');
                    tr.dataset.employeeName = row['اسم المشارك'];

                    tr.innerHTML = `
                        <td>${row['اسم المشارك']}</td>
                        <td>${row['الجهة'] || ''}</td>
                        <td><input type="checkbox" data-activity-name="المشاركة بزيارة" ${row['المشاركة بزيارة'] ? 'checked' : ''}></td>
                        <td><input type="checkbox" data-activity-name="اليوم الأول لقاء المفتي" ${row['اليوم الأول لقاء المفتي'] ? 'checked' : ''}></td>
                        <td><input type="checkbox" data-activity-name="اليوم الأول مأدبة غداء / عشاء" ${row['اليوم الأول مأدبة غداء / عشاء'] ? 'checked' : ''}></td>
                        <td><input type="checkbox" data-activity-name="اليوم الثاني مجلس نسك" ${row['اليوم الثاني مجلس نسك'] ? 'checked' : ''}></td>
                        <td><input type="checkbox" data-activity-name="اليوم الثاني الأنشطة الإعلامية" ${row['اليوم الثاني الأنشطة الإعلامية'] ? 'checked' : ''}></td>
                        <td><input type="checkbox" data-activity-name="اليوم الثاني لقاء الوفد" ${row['اليوم الثاني لقاء الوفد'] ? 'checked' : ''}></td>
                    `;
                    activityTableBody.appendChild(tr);
                });

                formStatus.textContent = 'تم تحميل البيانات بنجاح.';
                formStatus.className = 'success';
            } else {
                formStatus.textContent = 'لا توجد بيانات لعرضها.';
                formStatus.className = 'info';
            }
        } catch (error) {
            console.error('Error loading data:', error);
            formStatus.textContent = 'فشل تحميل البيانات. تأكد من الرابط وصلاحيات الوصول.';
            formStatus.className = 'error';
        }
    }

    async function sendUpdatesToSheet(employeeName, activityName, isChecked, checkboxElement) {
        formStatus.textContent = `جاري تحديث (${activityName})...`;
        formStatus.className = 'info';

        const department = checkboxElement.closest('tr').querySelector('td:nth-child(2)').textContent;

        try {
            const payload = {
                employeeName: employeeName,
                department: department,
                activityUpdates: { [activityName]: isChecked }
            };

            await fetch(GOOGLE_APPS_SCRIPT_WEB_APP_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            formStatus.textContent = 'تم تحديث النشاط بنجاح.';
            formStatus.className = 'success';
        } catch (error) {
            console.error('Error sending update:', error);
            formStatus.textContent = 'فشل تحديث النشاط. جارٍ إعادة الحالة السابقة.';
            formStatus.className = 'error';
            checkboxElement.checked = !isChecked;
        }
    }

    activityTableBody.addEventListener('change', (event) => {
        if (event.target.type === 'checkbox') {
            const checkbox = event.target;
            const row = checkbox.closest('tr');
            const employeeName = row.dataset.employeeName;
            const activityName = checkbox.dataset.activityName;
            const isChecked = checkbox.checked;

            if (employeeName && activityName) {
                sendUpdatesToSheet(employeeName, activityName, isChecked, checkbox);
            }
        }
    });

    if (updateButton) {
        updateButton.addEventListener('click', loadDataFromSheet);
    }

    loadDataFromSheet();
});