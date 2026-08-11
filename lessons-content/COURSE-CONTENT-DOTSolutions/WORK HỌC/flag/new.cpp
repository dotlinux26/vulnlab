#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
typedef tuple<int, int, int> Virus; // (t, d, s)

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    ll h, a, b;
    cin >> n >> h >> a >> b;

    vector<Virus> v(n);
    for (int i = 0; i < n; ++i) {
        int t, d, s;
        cin >> t >> d >> s;
        v[i] = {t, d, s};
    }

    ll time = 0;
    ll energy = h;
    ll recover_end = 0;
    ll res = 0;
    ll curr_strength = 0;
    ll curr_energy_used = 0;

    // max-heap by s
    priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> min_heap; // (s, d)

    for (int i = 0; i < n; ++i) {
        auto [t, d, s] = v[i];

        // Nếu đang hồi phục thì bỏ qua virus này
        if (t < recover_end) continue;

        // Nếu không đủ năng lượng để đánh tiếp
        if (curr_energy_used + d > h) {
            // Cân nhắc loại bỏ virus yếu nhất để nhét con mới vào
            if (!min_heap.empty() && min_heap.top().first < s) {
                auto [s_old, d_old] = min_heap.top();
                min_heap.pop();

                curr_strength -= s_old;
                curr_energy_used -= d_old;

                min_heap.push({s, d});
                curr_strength += s;
                curr_energy_used += d;
            } else {
                // Không có lợi, reset lại phiên (bắt buộc hoặc chủ động retreat)
                res = max(res, curr_strength);
                curr_energy_used = 0;
                curr_strength = 0;
                while (!min_heap.empty()) min_heap.pop();

                // Bị force-out do không đủ năng lượng, nghỉ a
                recover_end = t + a;
                continue;
            }
        } else {
            // Còn năng lượng thì thêm vào heap
            min_heap.push({s, d});
            curr_strength += s;
            curr_energy_used += d;
        }
    }

    res = max(res, curr_strength);
    cout << res << '\n';

    return 0;
}
