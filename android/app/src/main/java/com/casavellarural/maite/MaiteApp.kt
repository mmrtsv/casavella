package com.casavellarural.maite

import android.app.Application
import coil.ImageLoader
import coil.ImageLoaderFactory
import coil.decode.SvgDecoder
import com.casavellarural.maite.data.Api

/** Images (stay photos, uploads, Instagram thumbnails) load through the same client as the API, so Access lets them through */
class MaiteApp : Application(), ImageLoaderFactory {
    override fun newImageLoader() = ImageLoader.Builder(this).okHttpClient { Api.client }.components { add(SvgDecoder.Factory()) }.crossfade(true).build()
}
