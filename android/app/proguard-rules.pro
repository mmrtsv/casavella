# kotlinx.serialization keeps its generated serializers
-keepattributes *Annotation*, InnerClasses
-keepclassmembers class com.casavellarural.maite.** { *** Companion; }
-keepclasseswithmembers class com.casavellarural.maite.** { kotlinx.serialization.KSerializer serializer(...); }
-keep,includedescriptorclasses class com.casavellarural.maite.**$$serializer { *; }
# The template renderer's JavaScript bridge
-keepclassmembers class * { @android.webkit.JavascriptInterface <methods>; }
-dontwarn org.slf4j.**
