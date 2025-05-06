import { Rating } from "flowbite-react";
import NavbarComponent from "../../components/NavbarComponent";

function RatingUlasan() {
  return (
    <>
      <NavbarComponent />
      <div className="bg-orange-50 min-h-screen py-8">
        <div className="max-w-3xl mx-auto bg-white p-6 rounded-2xl shadow-md">
          {/* Komponen Rating */}
          <div className="flex items-center gap-2 mb-2">
            <Rating>
              <Rating.Star filled />
              <Rating.Star filled />
              <Rating.Star filled />
              <Rating.Star filled />
              <Rating.Star />
            </Rating>
            <p className="text-sm font-medium text-gray-600">4.95 out of 5</p>
          </div>

          <p className="text-sm font-medium text-gray-500 mb-4">1,745 global ratings</p>

          {/* Progress bar per rating */}
          {[["5 star", 70], ["4 star", 17], ["3 star", 8], ["2 star", 4], ["1 star", 1]].map(
            ([label, value]) => (
              <div className="flex items-center mt-3" key={label}>
                <span className="text-sm font-medium text-yellow-600 w-16">{label}</span>
                <div className="w-2/4 h-4 mx-4 bg-gray-200 rounded">
                  <div
                    className="h-4 bg-yellow-400 rounded"
                    style={{ width: `${value}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-600">{value}%</span>
              </div>
            )
          )}

          {/* Ulasan pengguna */}
          <div className="mt-8 border-t pt-6">
            <article>
              <div className="flex items-center mb-4">
                <img
                  className="w-10 h-10 me-4 rounded-full object-cover"
                  src="/docs/images/people/profile-picture-5.jpg"
                  alt="Profile"
                />
                <div className="font-medium text-gray-800">
                  <p>
                    Jese Leos
                    <time
                      dateTime="2014-08-16 19:00"
                      className="block text-sm text-gray-500"
                    >
                      Joined on August 2014
                    </time>
                  </p>
                </div>
              </div>
              <Rating>
                <Rating.Star filled />
                <Rating.Star filled />
                <Rating.Star filled />
                <Rating.Star filled />
                <Rating.Star />
              </Rating>
              <p className="mt-2 text-sm text-gray-600">
                Very helpful and easy to use. Great support from the team!
              </p>
            </article>
          </div>
        </div>
      </div>
    </>
  );
}

export default RatingUlasan;
